import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { In, Repository } from 'typeorm';
import Parser, { Item } from 'rss-parser';
import { Blog } from '../blog/entities/blog.entity';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { validate } from 'class-validator';
import { htmlContentToText } from 'src/common/utils/htmlContentToText';
import { CreateRssCategoryDto } from './dto/create-rss-category.dto';
import { RssCategory } from './entities/rss-category.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(RssCategory)
    private readonly rssCategoryRepository: Repository<RssCategory>,
    private readonly dataSource: DataSource, // DataSource 주입 추가
  ) {}

  async createRssCategory(createRssCategoryDto: CreateRssCategoryDto) {
    const rssCategory = this.rssCategoryRepository.create(createRssCategoryDto);
    return this.rssCategoryRepository.save(rssCategory);
  }

  async parseRss(rssUrl: string) {
    try {
      const parser = new Parser({
        customFields: {
          item: [['content:encoded', 'fullContent']],
        },
      });
      const feed = await parser.parseURL(rssUrl);

      return feed;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : '알 수 없는 에러 발생',
      );
    }
  }

  async parseAllRss() {
    const blogs = await this.blogRepository.find();
    const promises = blogs.map((blog) =>
      this.parseRss(blog.rssUrl)
        .then((feed) => ({
          feed,
          blogId: blog.id,
        }))
        .catch((error) => {
          this.logger.error(`RSS 파싱 실패 (${blog.rssUrl}):`, error);
          throw error;
        }),
    );

    const feeds = await Promise.allSettled(promises);

    feeds.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.logger.log(`성공: ${blogs[index].name}`);
      } else {
        this.logger.error(
          `실패: ${blogs[index].name} - ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
        );
      }
    });

    return feeds;
  }

  async getExistingFeedItem(sourceUrls: string[]): Promise<Set<string>> {
    if (sourceUrls.length === 0) {
      return new Set();
    }

    const existingPosts = await this.postRepository.find({
      where: {
        sourceUrl: In(sourceUrls),
      },
      select: ['sourceUrl'],
    });

    return new Set(existingPosts.map((post) => post.sourceUrl));
  }

  async saveRssToPost() {
    const feeds = await this.parseAllRss();

    // 모든 피드 아이템의 URL 수집
    const allSourceUrls: string[] = [];
    const feedItems: Array<{
      item: Item & { fullContent?: string };
      blogId: number;
      sourceUrl: string;
    }> = [];

    for (const result of feeds) {
      if (result.status !== 'fulfilled') {
        continue;
      }
      const { feed, blogId } = result.value;
      const items = feed.items || [];

      for (const item of items) {
        const sourceUrl = item.link || '';
        if (sourceUrl) {
          allSourceUrls.push(sourceUrl);
          feedItems.push({ item, blogId, sourceUrl });
        }
      }
    }

    // 한 번의 쿼리로 존재하는 URL 조회
    const existingUrls = await this.getExistingFeedItem(allSourceUrls);

    // 존재하지 않는 아이템만 저장
    for (const { item, blogId, sourceUrl } of feedItems) {
      if (existingUrls.has(sourceUrl)) {
        this.logger.log(`이미 존재하는 게시글 건너뛰기: ${item.title}`);
        continue;
      }
      await this.dataSource.transaction(async (manager) => {
        try {
          const publishedAt = item.pubDate
            ? new Date(item.pubDate)
            : new Date();

          const createPostDto = new CreatePostDto();
          createPostDto.blogId = blogId;
          createPostDto.title = item.title || '제목 없음';
          createPostDto.author = item.creator || '작성자 없음';
          createPostDto.shortSummary = item.summary || '요약 없음';
          createPostDto.detailedSummary = item.fullContent
            ? htmlContentToText(item.fullContent)
            : '상세 설명 없음';
          createPostDto.sourceUrl = sourceUrl;
          createPostDto.publishedAt = publishedAt;

          const errors = await validate(createPostDto);
          if (errors.length > 0) {
            this.logger.warn(
              `DTO 검증 실패 (${item.title}):`,
              errors.map((e) => Object.values(e.constraints || {})).flat(),
            );
            throw new Error('DTO 검증 실패');
          }

          const post = manager.create(Post, {
            blog: { id: createPostDto.blogId } as Blog,
            title: createPostDto.title,
            author: createPostDto.author,
            shortSummary: createPostDto.shortSummary,
            detailedSummary: createPostDto.detailedSummary,
            sourceUrl: createPostDto.sourceUrl,
            publishedAt: createPostDto.publishedAt,
          });

          const savedPost = await manager.save(post);
          this.logger.log(`포스트 저장 완료 (${savedPost.title})`);

          if (Array.isArray(item.categories) && item.categories.length > 0) {
            for (const categoryName of item.categories || []) {
              if (categoryName && typeof categoryName === 'string') {
                const rssCategory = manager.create(RssCategory, {
                  post: { id: savedPost.id } as Post,
                  name: categoryName.trim().substring(0, 50),
                });
                await manager.save(rssCategory);
                this.logger.log(
                  `카테고리 저장 완료: ${categoryName} (Post: ${savedPost.title})`,
                );
              }
            }
          }
        } catch (error) {
          this.logger.error(
            `포스트 저장 실패 (${item.title}):`,
            error instanceof Error ? error.message : String(error),
          );
          throw error;
        }
      });
    }
  }
}

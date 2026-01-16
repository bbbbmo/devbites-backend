import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { In, Repository } from 'typeorm';
import Parser, { Item } from 'rss-parser';
import { Blog } from '../blog/entities/blog.entity';
import { htmlContentToText } from 'src/common/utils/htmlContentToText';
import { CreateRssCategoryDto } from './dto/create-rss-category.dto';
import { RssCategory } from './entities/rss-category.entity';
import { DataSource } from 'typeorm';
import { validateKorean } from 'src/common/utils/validateKorean';
import { GptService } from '../ai/gpt.service';
import { Cron, CronExpression } from '@nestjs/schedule';

type PreparedPost = {
  blogId: number;
  title: string;
  author: string;
  shortSummary: string;
  detailedSummary: string;
  sourceUrl: string;
  publishedAt: Date;
  categories: string[];
};

type FeedItem = {
  item: Item & { fullContent?: string };
  blogId: number;
  sourceUrl: string;
};

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
    private readonly gptService: GptService,
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

  /**
   * RSS 피드 결과에서 모든 아이템과 URL을 수집
   * @param feeds parseAllRss()의 결과
   * @returns 수집된 sourceUrl 배열과 feedItems 배열
   */
  private collectFeedItems(
    feeds: PromiseSettledResult<{
      feed: Parser.Output<Item>;
      blogId: number;
    }>[],
  ): { allSourceUrls: string[]; feedItems: FeedItem[] } {
    const allSourceUrls: string[] = [];
    const feedItems: FeedItem[] = [];

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

    return { allSourceUrls, feedItems };
  }

  private async preparePosts(
    feeds: PromiseSettledResult<{
      feed: Parser.Output<Item>;
      blogId: number;
    }>[],
  ): Promise<PreparedPost[]> {
    const preparedPosts: PreparedPost[] = [];
    try {
      const { allSourceUrls, feedItems } = this.collectFeedItems(feeds);

      // 한 번의 쿼리로 존재하는 URL 조회
      const existingUrls = await this.getExistingFeedItem(allSourceUrls);

      for (const { item, blogId, sourceUrl } of feedItems) {
        if (existingUrls.has(sourceUrl)) {
          this.logger.log(`이미 존재하는 게시글 건너뛰기: ${item.title}`);
          continue;
        }

        if (!item.title || !item.fullContent) {
          this.logger.log(
            `제목 또는 내용이 없는 게시글 건너뛰기: ${item.title}`,
          );
          continue;
        }

        if (!validateKorean(item.title + item.fullContent)) {
          this.logger.log(`한글이 아닌 게시글 건너뛰기: ${item.title}`);
          continue;
        }

        const plainTextContent = htmlContentToText(item.fullContent || '');

        this.logger.log(`GPT 요약 생성 중: ${item.title}`);

        const { shortSummary, detailedSummary } =
          await this.gptService.summarizePost(plainTextContent);

        this.logger.log(
          `요약 생성 완료: ${item.title}, 요약 내용: ${shortSummary}, 상세 내용: ${detailedSummary}`,
        );

        preparedPosts.push({
          blogId,
          title: item.title || '제목 없음',
          author: item.creator || '작성자 없음',
          shortSummary,
          detailedSummary,
          sourceUrl,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          categories: item.categories || [],
        });
      }

      return preparedPosts;
    } catch (error) {
      this.logger.error('게시글 준비 실패:', error);
      throw error;
    }
  }

  private async savePostWithCategories(preparedPosts: PreparedPost[]) {
    const CHUNK_SIZE = 10;

    for (let i = 0; i < preparedPosts.length; i += CHUNK_SIZE) {
      const chunk = preparedPosts.slice(i, i + CHUNK_SIZE);

      await this.dataSource.transaction(async (manager) => {
        for (const postData of chunk) {
          const post = manager.create(Post, {
            blog: { id: postData.blogId } as Blog,
            title: postData.title,
            author: postData.author,
            shortSummary: postData.shortSummary,
            detailedSummary: postData.detailedSummary,
            sourceUrl: postData.sourceUrl,
            publishedAt: postData.publishedAt,
          });

          const savedPost = await manager.save(post);
          this.logger.log(
            `포스트 저장 완료: ${savedPost.title}\n 짧은 요약: ${savedPost.shortSummary}\n 상세 요약: ${savedPost.detailedSummary}`,
          );

          if (
            !Array.isArray(postData.categories) ||
            postData.categories.length === 0
          ) {
            this.logger.log(
              `카테고리가 없는 게시글 건너뛰기: ${savedPost.title}`,
            );
            continue;
          }

          for (const categoryName of postData.categories) {
            const category = manager.create(RssCategory, {
              post: { id: savedPost.id } as Post,
              name: categoryName.trim().substring(0, 50),
            });
            await manager.save(category);
            this.logger.log(`카테고리 저장 완료: ${category.name}`);
          }
        }
      });

      this.logger.log(`배치 저장 완료: ${i + 1} ~ ${i + chunk.length}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'saveRssToPost',
    timeZone: 'Asia/Seoul',
  })
  async saveRssToPost() {
    const feeds = await this.parseAllRss();
    const preparedPosts = await this.preparePosts(feeds);
    if (preparedPosts.length === 0) {
      this.logger.log('저장할 게시글이 없습니다.');
      return;
    }
    await this.savePostWithCategories(preparedPosts);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { Repository } from 'typeorm';
import Parser from 'rss-parser';
import { Blog } from '../blog/entities/blog.entity';
import { CreatePostDto } from '../post/dto/create-post.dto';
import { validate } from 'class-validator';

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
  ) {}

  async parseRss(rssUrl: string) {
    try {
      const parser = new Parser();
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

  async saveRssToPost() {
    const feeds = await this.parseAllRss();

    for (const result of feeds) {
      if (result.status !== 'fulfilled') {
        continue;
      }
      const { feed, blogId } = result.value;
      const items = feed.items || [];

      for (const item of items) {
        try {
          const publishedAt = item.pubDate
            ? new Date(item.pubDate)
            : new Date();

          // DTO 생성 및 검증
          const createPostDto = new CreatePostDto();
          createPostDto.blogId = blogId;
          createPostDto.title = item.title || '제목 없음';
          createPostDto.author = item.creator || '작성자 없음';
          createPostDto.shortSummary = item.summary || '요약 없음';
          createPostDto.detailedSummary =
            item.contentSnippet || '상세 설명 없음';
          createPostDto.sourceUrl = item.link || '';
          createPostDto.publishedAt = publishedAt;

          // DTO 검증
          const errors = await validate(createPostDto);
          if (errors.length > 0) {
            this.logger.warn(
              `DTO 검증 실패 (${item.title}):`,
              errors.map((e) => Object.values(e.constraints || {})).flat(),
            );
            continue;
          }

          // Entity 생성 및 저장
          const post = this.postRepository.create({
            blog: { id: createPostDto.blogId } as Blog,
            title: createPostDto.title,
            author: createPostDto.author,
            shortSummary: createPostDto.shortSummary,
            detailedSummary: createPostDto.detailedSummary,
            sourceUrl: createPostDto.sourceUrl,
            publishedAt: createPostDto.publishedAt,
          });

          const savedPost = await this.postRepository.save(post);
          this.logger.log(`포스트 저장 완료 (${savedPost.title})`);
        } catch (error) {
          this.logger.error(
            `포스트 저장 실패 (${item.title}):`,
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }
  }
}

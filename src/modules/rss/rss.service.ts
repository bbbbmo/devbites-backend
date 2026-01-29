import { Injectable } from '@nestjs/common';
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
import { Cron, CronExpression } from '@nestjs/schedule';
import { BatchService } from '../ai/batch.service';
import { BatchResult, BatchTarget } from 'src/common/types/batch.types';
import { BatchMetaService } from '../ai/batch-meta.service';
import { cronLogger } from 'src/logger/cron.logger';

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
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(RssCategory)
    private readonly rssCategoryRepository: Repository<RssCategory>,
    private readonly dataSource: DataSource, // DataSource 주입 추가
    private readonly batchService: BatchService,
    private readonly batchMetaService: BatchMetaService,
  ) {}

  async createRssCategory(createRssCategoryDto: CreateRssCategoryDto) {
    const rssCategory = this.rssCategoryRepository.create(createRssCategoryDto);
    return this.rssCategoryRepository.save(rssCategory);
  }

  private async parseRss(rssUrl: string) {
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

  private async parseAllRss() {
    const blogs = await this.blogRepository.find();
    const promises = blogs.map((blog) =>
      this.parseRss(blog.rssUrl)
        .then((feed) => ({
          feed,
          blogId: blog.id,
        }))
        .catch((error) => {
          cronLogger.error(`RSS 파싱 실패 (${blog.rssUrl}):`, error);
          throw error;
        }),
    );

    const feeds = await Promise.allSettled(promises);

    feeds.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        cronLogger.info(`성공: ${blogs[index].name}`);
      } else {
        cronLogger.error(
          `실패: ${blogs[index].name} - ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
        );
      }
    });

    return feeds;
  }

  private async getExistingFeedItem(
    sourceUrls: string[],
  ): Promise<Set<string>> {
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

  private async prepareBatchTargets(
    feeds: PromiseSettledResult<{
      feed: Parser.Output<Item>;
      blogId: number;
    }>[],
  ): Promise<BatchTarget[]> {
    const targets: BatchTarget[] = [];

    const { allSourceUrls, feedItems } = this.collectFeedItems(feeds);
    const existingUrls = await this.getExistingFeedItem(allSourceUrls);

    for (const { item, blogId, sourceUrl } of feedItems) {
      let id = 0;
      if (existingUrls.has(sourceUrl)) {
        cronLogger.info(`이미 존재하는 게시글 건너뛰기: ${item.title}`);
        continue;
      }

      if (
        !item.title ||
        item.title.trim() === '' ||
        !item.fullContent ||
        item.fullContent.trim() === ''
      ) {
        cronLogger.info(`제목 또는 내용이 없는 게시글 건너뛰기: ${item.title}`);
        continue;
      }

      if (!validateKorean(item.title + item.fullContent)) {
        cronLogger.info(`한글이 아닌 게시글 건너뛰기: ${item.title}`);
        continue;
      }

      targets.push({
        id: id++,
        blogId,
        title: item.title,
        author: item.creator || '작성자 없음',
        sourceUrl,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        categories: item.categories || [],
        content: htmlContentToText(item.fullContent),
      });
    }

    return targets;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'createGptBatch',
    timeZone: 'Asia/Seoul',
  })
  async createGptBatch() {
    const feeds = await this.parseAllRss();
    const targets = await this.prepareBatchTargets(feeds);

    if (targets.length === 0) {
      cronLogger.info('Batch 생성 대상 없음');
      return;
    }

    this.batchService.createBatchInput(
      targets.map((target) => ({
        id: target.id,
        content: target.content,
      })),
    );

    const batch = await this.batchService.processBatch();

    await this.batchMetaService.saveBatchMeta(batch.id, targets);
  }

  private mergeBatchResult(
    targets: BatchTarget[],
    results: BatchResult[],
  ): PreparedPost[] {
    const resultMap = new Map(
      results.map((r) => [Number(r.custom_id), r.response.output_parsed]),
    );

    return targets
      .filter((t) => resultMap.has(t.id))
      .map((t) => {
        const summary = resultMap.get(t.id);

        if (!summary) {
          throw new Error(`Summary not found for target ID: ${t.id}`);
        }

        if (!summary.shortSummary || !summary.detailedSummary) {
          throw new Error(`Invalid GPT result for ${t.id}`);
        }

        return {
          blogId: t.blogId,
          title: t.title,
          author: t.author,
          shortSummary: summary.shortSummary,
          detailedSummary: summary.detailedSummary,
          sourceUrl: t.sourceUrl,
          publishedAt: t.publishedAt,
          categories: t.categories,
        };
      });
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
          cronLogger.info(
            `포스트 저장 완료: ${savedPost.title}\n 짧은 요약: ${savedPost.shortSummary}\n 상세 요약: ${savedPost.detailedSummary}`,
          );

          if (
            !Array.isArray(postData.categories) ||
            postData.categories.length === 0
          ) {
            cronLogger.info(
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
            cronLogger.info(`카테고리 저장 완료: ${category.name}`);
          }
        }
      });

      cronLogger.info(`배치 저장 완료: ${i + 1} ~ ${i + chunk.length}`);
    }
  }

  @Cron('*/30 * * * *', {
    name: 'processGptBatchResult',
  })
  async processGptBatchResult() {
    cronLogger.info('=== GPT Batch 결과 처리 크론 시작 ===');
    const pendingBatches = await this.batchMetaService.getPendingBatches();
    cronLogger.info(`대기 중인 BatchMeta 개수: ${pendingBatches.length}`);

    for (const batchMeta of pendingBatches) {
      const batch = await this.batchService.getBatch(batchMeta.batchId);
      cronLogger.info(
        `Batch 상태 확인 - batchId: ${batchMeta.batchId}, status: ${batch.status}`,
      );

      if (batch.status !== 'completed') {
        cronLogger.info(
          `Batch 상태가 completed 아님. 건너뜀 - batchId: ${batchMeta.batchId}`,
        );
        continue;
      }

      const locked = await this.batchMetaService.markProcessing(
        batchMeta.batchId,
      );

      if (!locked) continue;

      try {
        const results = await this.batchService.getBatchResults(batch);
        cronLogger.info(
          `Batch 결과 조회 완료 - batchId: ${batchMeta.batchId}, 결과 개수: ${results.length}`,
        );

        const preparedPosts = this.mergeBatchResult(batchMeta.targets, results);

        await this.savePostWithCategories(preparedPosts);
        cronLogger.info(`포스트 저장 완료 - batchId: ${batchMeta.batchId}`);

        await this.batchMetaService.markCompleted(batchMeta.batchId);

        this.batchService.cleanupBatchInput();
      } catch (error) {
        cronLogger.error(`Batch 처리 실패: ${batchMeta.batchId}`, error);
        await this.batchMetaService.markFailed(batchMeta.batchId);
      }
    }
    cronLogger.info('=== GPT Batch 결과 처리 크론 종료 ===');
  }
}

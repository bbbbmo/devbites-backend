import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { Repository } from 'typeorm';
import axios from 'axios';
import FeedParser, { Readable } from 'feedparser'; // default import로 수정

type RssData = {
  title: string;
  link: string;
  summary: string;
  description?: string;
  pubDate?: Date;
  blogId?: number;
};

@Injectable()
export class RssService {
  private rssUrls: string[] = [
    'https://d2.naver.com/d2.atom',
    'https://techblog.woowahan.com/feed',
    'https://helloworld.kurly.com/feed.xml',
  ];

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async fetchRssData() {
    for (const rssUrl of this.rssUrls) {
      try {
        const items = await this.fetchRss(rssUrl);

        for (const item of items) {
          // 중복 체크 (sourceUrl 기준)
          const exists = await this.postRepository.findOneBy({
            sourceUrl: item.link,
          });
          if (!exists) {
            await this.postRepository.save({
              blogId: item.blogId || 1, // 적절한 blogId 설정 필요
              title: item.title,
              shortSummary: item.summary || '',
              detailedSummary: item.description || '',
              sourceUrl: item.link,
              publishedAt: item.pubDate || new Date(),
            });
          }
        }
      } catch (error) {
        console.error(`Failed to fetch RSS from ${rssUrl}:`, error);
        // 에러 발생해도 다음 URL 계속 처리
      }
    }
  }

  private async fetchRss(rssUrl: string): Promise<RssData[]> {
    const items: RssData[] = [];

    try {
      const response = await axios.get(rssUrl, { responseType: 'stream' });
      const feedParser = new FeedParser({});

      return new Promise((resolve, reject) => {
        (response.data as Readable).pipe(feedParser);

        feedParser.on('error', (error) => {
          reject(error instanceof Error ? error : new Error(String(error)));
        });

        feedParser.on('readable', () => {
          let item: FeedParser.Item;
          while ((item = feedParser.read())) {
            items.push({
              title: item.title,
              link: item.link,
              summary: item.summary,
              description: item.description,
              pubDate: item.pubdate ? new Date(item.pubdate) : undefined,
            });
          }
        });

        feedParser.on('end', () => {
          resolve(items);
        });
      });
    } catch (error) {
      throw new Error(
        `Failed to fetch RSS from ${rssUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

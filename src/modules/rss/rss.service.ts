import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { Repository } from 'typeorm';

export type RssData = {
  title: string;
  link: string;
  summary: string;
  description?: string;
  pubDate?: Date;
  blogId?: number;
};

@Injectable()
export class RssService {
  private readonly logger = new Logger(RssService.name);
  private rssUrls: string[] = [
    'https://d2.naver.com/d2.atom',
    // 'https://techblog.woowahan.com/feed',
    // 'https://helloworld.kurly.com/feed.xml',
  ];

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}
}

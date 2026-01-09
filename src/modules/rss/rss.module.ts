import { Module } from '@nestjs/common';
import { RssService } from './rss.service';
import { RssController } from './rss.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../post/entities/post.entity';
import { Blog } from '../blog/entities/blog.entity';
import { RssCategory } from './entities/rss-category.entity';
import { GptModule } from '../ai/gpt.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Blog, RssCategory]), GptModule],
  controllers: [RssController],
  providers: [RssService],
})
export class RssModule {}

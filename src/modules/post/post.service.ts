import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { GetPostsParams, GetPostsResponse } from 'src/common/types/post.types';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getPosts(params: GetPostsParams): Promise<GetPostsResponse> {
    const {
      blogId,
      title,
      shortSummary,
      sort = 'latest',
      page = 1,
      size = 20,
    } = params;

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .leftJoinAndSelect('post.rssCategories', 'rssCategories')
      .select([
        'post',
        'blog',
        'rssCategories.id',
        'rssCategories.name', // postId 제외
      ]);

    if (blogId) {
      query.andWhere('post.blog_id = :blogId', { blogId });
    }
    if (title) {
      query.andWhere('post.title LIKE :title', { title: `%${title}%` });
    }
    if (shortSummary) {
      query.andWhere('post.short_summary LIKE :shortSummary', {
        shortSummary: `%${shortSummary}%`,
      });
    }

    query.orderBy('post.published_at', sort === 'latest' ? 'DESC' : 'ASC');

    const items = await query
      .clone()
      .orderBy('post.publishedAt', sort === 'latest' ? 'DESC' : 'ASC')
      .take(size)
      .skip((page - 1) * size)
      .getMany();

    const total = await query.clone().getCount();

    const hasMore = page * size < total;

    return {
      items,
      total,
      hasMore,
    };
  }

  async getPostById(id: number): Promise<Post | null> {
    return await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .leftJoinAndSelect('post.rssCategories', 'rssCategories')
      .select([
        'post',
        'blog',
        'rssCategories.id',
        'rssCategories.name', // postId 제외
      ])
      .where('post.id = :id', { id })
      .getOne();
  }
}

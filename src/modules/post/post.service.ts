import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { GetPostsParams } from 'src/common/types/post.types';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getPosts(params: GetPostsParams): Promise<Post[]> {
    const { blogId, title, shortSummary, sort = 'latest' } = params;
    
   const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blog', 'blog')
      .leftJoinAndSelect('post.rssCategories', 'rssCategories')
      .select([
        'post',
        'blog',
        'rssCategories.id',
        'rssCategories.name', // postId 제외
      ])

      if (blogId) {
        query.andWhere('post.blogId = :blogId', { blogId });
      }
      if (title) {
        query.andWhere('post.title LIKE :title', { title: `%${title}%` });
      }
      if (shortSummary) {
        query.andWhere('post.shortSummary LIKE :shortSummary', { shortSummary: `%${shortSummary}%` });
      }

      if (sort === 'latest') {
        query.orderBy('post.publishedAt', 'DESC');
      } else {
        query.orderBy('post.publishedAt', 'ASC');
      }

      return await query.getMany();
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

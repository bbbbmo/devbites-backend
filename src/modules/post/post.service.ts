import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async getAllPosts(): Promise<Post[]> {
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
      .orderBy('post.createdAt', 'DESC')
      .getMany();
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

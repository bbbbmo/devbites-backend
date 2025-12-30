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
    return await this.postRepository.find({
      order: { createdAt: 'DESC' }, // 최신순 정렬
    });
  }

  async getPostById(id: number): Promise<Post | null> {
    return await this.postRepository.findOne({ where: { id } });
  }
}

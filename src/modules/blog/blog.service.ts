import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from './entities/blog.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
  ) {}

  getAllBlogs(): Promise<Blog[]> {
    return this.blogRepository.find();
  }

  getBlogById(id: number): Promise<Blog | null> {
    return this.blogRepository.findOne({ where: { id } });
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(): Promise<Post[]> {
    return await this.postService.getAllPosts();
  }

  @Get(':id')
  async getPostById(@Param('id') id: number): Promise<Post | null> {
    return await this.postService.getPostById(id);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';
import type { GetPostsParams } from 'src/common/types/post.types';


@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(@Query() params: GetPostsParams): Promise<Post[]> {
    return await this.postService.getPosts(params);
  }

  @Get(':id')
  async getPostById(@Param('id') id: number): Promise<Post | null> {
    return await this.postService.getPostById(id);
  }
}

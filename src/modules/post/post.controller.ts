import { Controller, Get } from '@nestjs/common';
import { Post } from './entities/post.entity';
import { PostService } from './post.service';

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts(): Promise<Post[]> {
    return await this.postService.getAllPosts();
  }
}

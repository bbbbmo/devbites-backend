import { Controller, Get, Param } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // @Post()
  // create(@Body() createBlogDto: CreateBlogDto) {
  //   return this.blogService.create(createBlogDto);
  // }

  @Get()
  findAll() {
    return this.blogService.getAllBlogs();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogService.getBlogById(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto) {
  //   return this.blogService.update(+id, updateBlogDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.blogService.remove(+id);
  // }
}

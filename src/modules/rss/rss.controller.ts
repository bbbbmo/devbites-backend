import { Body, Controller, Post } from '@nestjs/common';
import { RssService } from './rss.service';
import { CreateRssCategoryDto } from './dto/create-rss-category.dto';

@Controller('rss')
export class RssController {
  constructor(private readonly rssService: RssService) {}

  @Post('create-rss-category')
  async createRssCategory(@Body() createRssCategoryDto: CreateRssCategoryDto) {
    return this.rssService.createRssCategory(createRssCategoryDto);
  }
}

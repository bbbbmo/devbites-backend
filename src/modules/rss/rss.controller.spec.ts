import { Test, TestingModule } from '@nestjs/testing';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';

describe('RssController', () => {
  let controller: RssController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RssController],
      providers: [RssService],
    }).compile();

    controller = module.get<RssController>(RssController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

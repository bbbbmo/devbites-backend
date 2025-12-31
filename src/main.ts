import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RssService } from './modules/rss/rss.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true,
  });

  const rssService = app.get(RssService);
  await rssService.fetchRssData();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();

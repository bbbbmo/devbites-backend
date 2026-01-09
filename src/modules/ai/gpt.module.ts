import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';

@Module({
  providers: [GptService],
  exports: [GptService], // 다른 모듈에서 사용할 수 있도록 export
})
export class GptModule {}

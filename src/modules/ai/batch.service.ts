import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import OpenAI from 'openai';
import { Batch } from 'openai/resources';
import { BatchInput, BatchResult } from 'src/common/types/batch.types';
import { cronLogger } from 'src/logger/cron.logger';

@Injectable()
export class BatchService {
  private readonly openai: OpenAI;
  private readonly filePath = `batch-input.jsonl`;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private getPrompt(content: string): string {
    return `아래에 제공된 블로그 게시글을 요약하십시오.

      요약 규칙:
      1. 출력은 반드시 JSON 객체 형식으로만 작성할 것
      2. JSON 외의 설명 텍스트는 절대 포함하지 말 것
      3. 중요 핵심 단어, 기술 용어, 키워드는 \`\`(백틱)으로 감싸 코드 표시로 표현할 것
      4. 문체는 객관적이고 설명적인 '~니다.' 체로 통일할 것
      5. 추측, 의견, 감정 표현은 포함하지 말 것
      6. 한국어로 작성할 것
      
      출력 형식:
      {
        "shortSummary": string,
        "detailedSummary": string
      }
      
      세부 작성 기준:
      - shortSummary:
        - 전체 내용을 2~3문장으로 매우 간결하게 요약할 것
      - detailedSummary:
        - 반드시 문자열(string) 타입으로 반환할 것 (객체나 배열이 아닌 순수 텍스트 문자열)
        - 원문에서 "핵심 주제"만 선별하여 소제목으로 사용할 것 
        - 각 소제목 아래에는 2~4문장으로 핵심만 정리할 것
        - 소제목은 자연어 텍스트로 작성할 것 (기호 사용 금지)
        - 다음 형식을 반드시 따를 것:
        ### <소제목>
        <내용>
      
      입력 블로그 게시글:
      ${content}`;
  }

  createBatchInput(posts: BatchInput[]) {
    const lines = posts.map((post) =>
      JSON.stringify({
        custom_id: String(post.id),
        method: 'POST',
        url: '/v1/responses',
        body: {
          model: 'gpt-4o-mini',
          input: [
            {
              role: 'system',
              content: `당신은 기술 블로그 게시글을 정확하고 간결하게 요약하는 전문가입니다. JSON 형식으로 요약하세요.`,
            },
            {
              role: 'user',
              content: this.getPrompt(post.content),
            },
          ],
          text: { format: { type: 'json_object' } },
          temperature: 0.2,
        },
      }),
    );
    fs.writeFileSync(this.filePath, lines.join('\n'), 'utf-8');
  }

  async processBatch() {
    try {
      if (!fs.existsSync(this.filePath)) {
        throw new Error(`파일이 존재하지 않습니다: ${this.filePath}`);
      }

      const file = await this.openai.files.create({
        file: fs.createReadStream(this.filePath),
        purpose: 'batch',
      });
      cronLogger.info(`파일 업로드 완료: ${file.id}`);

      const batch = await this.openai.batches.create({
        input_file_id: file.id,
        endpoint: '/v1/responses',
        completion_window: '24h',
      });
      cronLogger.info(`배치 작업 생성: ${batch.id}, 상태: ${batch.status}`);

      return batch;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('배치 작업 생성 실패');
    }
  }

  /**
   * @description 배치 상태 조회
   * @param batchId batch id
   */
  async getBatch(batchId: string) {
    return this.openai.batches.retrieve(batchId);
  }

  /**
   * @description 배치 결과 조회
   * @param batch batch
   */
  async getBatchResults(batch: Batch): Promise<BatchResult[]> {
    if (!batch.output_file_id) {
      throw new Error('output_file_id가 없습니다.');
    }
    const file = await this.openai.files.content(batch.output_file_id);
    const text = await file.text();
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    return lines.map((line) => JSON.parse(line) as BatchResult);
  }

  /**
   * @description 배치 입력 파일 정리
   */
  cleanupBatchInput() {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}

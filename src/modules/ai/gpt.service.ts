import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

type SummaryResponse = {
  shortSummary: string;
  detailedSummary: string;
};

@Injectable()
export class GptService {
  private readonly logger = new Logger(GptService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async summarizePost(
    content: string,
  ): Promise<{ shortSummary: string; detailedSummary: string }> {
    try {
      const prompt = `Summarize the following blog post.

      Requirements:
      - shortSummary: 1~2 sentences covering the main idea
      - detailedSummary: ~500 characters, key points only, no missing info
      
      Return ONLY valid JSON in this format:
      {
        "shortSummary": string,
        "detailedSummary": string
      }
      
      Text:
      """${content}"""`;
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 기술 블로그 게시글을 정확하고 간결하게 요약하는 전문가입니다.
           JSON 형식으로 요약하세요.
          `,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const completion = response.choices[0]?.message?.content;

      if (!completion) {
        throw new Error('요약 실패');
      }

      const { shortSummary, detailedSummary } = JSON.parse(
        completion,
      ) as SummaryResponse;

      return { shortSummary, detailedSummary };
    } catch (error) {
      this.logger.error('GPT 요약 생성 실패: ', error);
      throw error;
    }
  }
}

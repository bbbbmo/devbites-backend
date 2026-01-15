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
      const prompt = `아래에 제공된 블로그 게시글을 요약하십시오.

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

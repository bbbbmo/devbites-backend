export type SummaryResponse = {
  shortSummary: string;
  detailedSummary: string;
};

export type BatchInput = {
  id: number;
  content: string;
};

export type BatchTarget = {
  id: number; // post 임시 ID or hash
  blogId: number;
  title: string;
  author: string;
  sourceUrl: string;
  publishedAt: Date;
  categories: string[];
  content: string; // GPT에 보낼 본문
};

type GptContent = {
  type: string;
  text: string; // JSON 문자열, {shortSummary, detailedSummary}
};

type GptOutput = {
  role: string; // assistant, user
  content: GptContent[];
};

export type BatchResult = {
  id: string;
  custom_id: string; // 1, 2, 3, ...
  response: {
    status_code: number;
    body: {
      output: GptOutput[];
    };
  };
};

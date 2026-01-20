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

export type BatchResult = {
    custom_id: number;
    response: { output_parsed: SummaryResponse };
};

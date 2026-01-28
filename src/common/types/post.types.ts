import { Post } from 'src/modules/post/entities/post.entity';

export type PostSortType = 'latest' | 'oldest';

export type GetPostsParams = {
  blogId?: number;
  title?: string;
  shortSummary?: string;
  sort?: PostSortType;
  page?: number;
  size?: number;
};

export type GetPostsResponse = {
  items: Post[];
  total: number;
  hasMore: boolean;
};

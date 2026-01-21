export type PostSortType = "latest" | "oldest";

export type GetPostsParams = {
  blogId?: number;
  title?: string;
  shortSummary?: string;
  sort?: PostSortType;
}
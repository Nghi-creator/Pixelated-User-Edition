import { encodeApiPathSegment } from "./apiPath.ts";

type SocialApiDependencies = {
  apiRequest: <T>(path: string, options?: RequestInit & { authenticated?: boolean; timeoutMs?: number }) => Promise<T>;
};

export function createSocialApi({ apiRequest }: SocialApiDependencies) {
  return {
    deleteComment: (commentId: string) =>
      apiRequest<void>(`/comments/${encodeApiPathSegment(commentId)}`, {
        method: "DELETE",
      }),
    gameComments: <TComment>(gameId: string, page: number) =>
      apiRequest<{ comments: TComment[]; hasMore: boolean }>(
        `/games/${encodeApiPathSegment(gameId)}/comments?page=${page}`,
        { authenticated: false },
      ),
    gameReactions: (gameId: string) =>
      apiRequest<{ reactions: { is_like: boolean; user_id: string }[] }>(
        `/games/${encodeApiPathSegment(gameId)}/reactions`,
        { authenticated: false },
      ),
    postComment: (gameId: string, content: string) =>
      apiRequest<{ success: true }>(`/games/${encodeApiPathSegment(gameId)}/comments`, {
        body: JSON.stringify({ content }),
        method: "POST",
      }),
    reportComment: (commentId: string, reason: string) =>
      apiRequest<{ success: true }>(
        `/moderation/comments/${encodeApiPathSegment(commentId)}/report`,
        {
          body: JSON.stringify({ reason }),
          method: "POST",
        },
      ),
    setCommentReaction: (commentId: string, isLike: boolean | null) =>
      apiRequest<{ reactions: { is_like: boolean; user_id: string }[] }>(
        `/comments/${encodeApiPathSegment(commentId)}/reaction`,
        {
          body: JSON.stringify({ isLike }),
          method: "PUT",
        },
      ),
    setGameReaction: (gameId: string, isLike: boolean | null) =>
      apiRequest<{ success: true }>(`/games/${encodeApiPathSegment(gameId)}/reaction`, {
        body: JSON.stringify({ isLike }),
        method: "PUT",
      }),
  };
}

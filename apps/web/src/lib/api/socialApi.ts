import { encodeApiPathSegment } from "./apiPath.ts";
import type { ApiRequest } from "./apiRequestTypes.ts";
import {
  commentsPageSchema,
  reactionsSchema,
  successSchema,
  voidSchema,
} from "./apiResponseSchemas.ts";

type SocialApiDependencies = {
  apiRequest: ApiRequest;
};

export function createSocialApi({ apiRequest }: SocialApiDependencies) {
  return {
    deleteComment: (commentId: string) =>
      apiRequest(`/comments/${encodeApiPathSegment(commentId)}`, { method: "DELETE" }, voidSchema),
    gameComments: (gameId: string, page: number) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}/comments?page=${page}`,
        { authenticated: false },
        commentsPageSchema,
      ),
    gameReactions: (gameId: string) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}/reactions`,
        { authenticated: false },
        reactionsSchema,
      ),
    postComment: (gameId: string, content: string) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}/comments`,
        { body: JSON.stringify({ content }), method: "POST" },
        successSchema,
      ),
    reportComment: (commentId: string, reason: string) =>
      apiRequest(
        `/moderation/comments/${encodeApiPathSegment(commentId)}/report`,
        {
          body: JSON.stringify({ reason }),
          method: "POST",
        },
        successSchema,
      ),
    setCommentReaction: (commentId: string, isLike: boolean | null) =>
      apiRequest(
        `/comments/${encodeApiPathSegment(commentId)}/reaction`,
        {
          body: JSON.stringify({ isLike }),
          method: "PUT",
        },
        reactionsSchema,
      ),
    setGameReaction: (gameId: string, isLike: boolean | null) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}/reaction`,
        { body: JSON.stringify({ isLike }), method: "PUT" },
        successSchema,
      ),
  };
}

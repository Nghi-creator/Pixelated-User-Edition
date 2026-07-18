import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getAuthSession, api } from "./apiClient";
import { queryKeys } from "./queryClient";
import type {
  ApiGame,
} from "./apiTypes";

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: queryKeys.authSession(),
    queryFn: getAuthSession,
  });
}

export function useProfileActivityQuery({
  enabled = true,
  userId,
}: {
  enabled?: boolean;
  userId: string | undefined;
}) {
  return useQuery({
    enabled,
    queryKey: queryKeys.profileActivity(userId),
    queryFn: () => api.profileActivity(),
  });
}

export function useFavoriteIdsQuery() {
  return useQuery({
    queryKey: queryKeys.favoriteIds(),
    queryFn: async () => {
      const session = await getAuthSession();
      if (!session) return new Set<string>();
      return api.favoriteIds();
    },
  });
}

export function useFavoritesQuery<TFavorite>({
  onMissingSession,
}: {
  onMissingSession?: () => void;
} = {}) {
  return useQuery({
    queryKey: queryKeys.favorites(),
    queryFn: async () => {
      const session = await getAuthSession();
      if (!session) {
        onMissingSession?.();
        return { favorites: [] as TFavorite[] };
      }

      return api.listFavorites<TFavorite>();
    },
  });
}

export function useFeaturedGamesQuery() {
  return useQuery({
    queryKey: queryKeys.featuredGames(),
    queryFn: api.featuredGames,
  });
}

export function useGameCatalogQuery({
  page,
  pageSize,
  platform = "",
  runtime = "all",
  search,
  enabled = true,
}: {
  enabled?: boolean;
  page: number;
  pageSize: number;
  platform?: string;
  runtime?: "all" | "browser" | "desktop" | "unavailable";
  search: string;
}) {
  return useQuery({
    enabled,
    queryKey: queryKeys.gameCatalog(page, pageSize, search, platform, runtime),
    queryFn: () => api.games({ page, pageSize, platform, runtime, search }),
  });
}

export function useGameCommentsQuery<TComment>(
  gameId: string | undefined,
) {
  return useInfiniteQuery({
    enabled: Boolean(gameId),
    initialPageParam: 1,
    queryKey: queryKeys.gameComments(gameId),
    queryFn: ({ pageParam }) =>
      api.gameComments<TComment>(gameId!, pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
  });
}

export function useGameMetadataQuery(gameId: string | undefined) {
  return useQuery<{ game: ApiGame }>({
    enabled: Boolean(gameId),
    queryKey: queryKeys.game(gameId),
    queryFn: () => api.game(gameId!),
  });
}

export function useGameReactionsQuery(gameId: string | undefined) {
  return useQuery({
    enabled: Boolean(gameId),
    queryKey: queryKeys.gameReactions(gameId),
    queryFn: () => api.gameReactions(gameId!),
  });
}

export function usePermissionsQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: queryKeys.permissions(),
    queryFn: api.permissions,
  });
}

export function useProfileQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    enabled,
    queryKey: queryKeys.profile(),
    queryFn: api.profile,
  });
}

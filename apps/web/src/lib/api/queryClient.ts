import { QueryClient, type QueryClient as QueryClientInstance } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export const queryKeys = {
  authSession: () => ["authSession"] as const,
  featuredGames: () => ["featuredGames"] as const,
  catalogFilters: () => ["catalogFilters"] as const,
  favorites: () => ["favorites"] as const,
  favoriteIds: () => ["favoriteIds"] as const,
  game: (gameId: string | undefined) => ["game", gameId] as const,
  gameCatalog: (
    page: number,
    pageSize: number,
    search: string,
    platform: string,
    runtime: string,
    genre = "",
    license = "",
  ) => ["gameCatalog", page, pageSize, search, platform, runtime, genre, license] as const,
  libraryGamePicker: (pageSize: number) =>
    ["libraryGamePicker", pageSize] as const,
  gameComments: (gameId: string | undefined) => ["gameComments", gameId] as const,
  gameReactions: (gameId: string | undefined) =>
    ["gameReactions", gameId] as const,
  localMultiplayerGames: () => ["localMultiplayerGames"] as const,
  permissions: () => ["permissions"] as const,
  profile: () => ["profile"] as const,
  profileActivity: (userId: string | undefined) => ["profileActivity", userId] as const,
};

export const invalidateFavoriteQueries = async (client: QueryClientInstance) => {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.favoriteIds() }),
    client.invalidateQueries({ queryKey: queryKeys.favorites() }),
  ]);
};

export const invalidateGameCommentsQuery = (
  client: QueryClientInstance,
  gameId: string | undefined,
) => client.invalidateQueries({ queryKey: queryKeys.gameComments(gameId) });

export const invalidateGameReactionsQuery = (
  client: QueryClientInstance,
  gameId: string | undefined,
) => client.invalidateQueries({ queryKey: queryKeys.gameReactions(gameId) });

export const invalidateProfileQueries = async (client: QueryClientInstance) => {
  await Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.profile() }),
    client.invalidateQueries({ queryKey: queryKeys.permissions() }),
  ]);
};

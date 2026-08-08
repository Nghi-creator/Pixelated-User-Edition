import type { ApiRequest } from "./apiRequestTypes.ts";
import {
  apiCatalogFiltersSchema,
  apiFeaturedGamesSchema,
  apiGameResponseSchema,
  apiPaginatedGamesSchema,
  favoritedSchema,
  favoriteListSchema,
  successSchema,
  voidSchema,
} from "./apiResponseSchemas.ts";
import { encodeApiPathSegment } from "./apiPath.ts";

type CatalogApiDependencies = {
  apiRequest: ApiRequest;
  clearFavoritesCache: () => void;
  getFavoriteIds: () => Promise<Set<string>>;
};

export function createCatalogApi({
  apiRequest,
  clearFavoritesCache,
  getFavoriteIds,
}: CatalogApiDependencies) {
  return {
    countPlay: (gameId: string, playEventId: string) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}/play-count`,
        {
          body: JSON.stringify({ clientEdition: "user", playEventId, runtimeKind: "wasm" }),
          method: "POST",
        },
        successSchema,
      ),
    favoriteIds: () => getFavoriteIds(),
    catalogFilters: () =>
      apiRequest("/games/filters", { authenticated: false }, apiCatalogFiltersSchema),
    games: (
      {
        genre = "",
        license = "",
        page = 1,
        pageSize = 15,
        platform = "",
        runtime = "all",
        search = "",
      }: {
        page?: number;
        pageSize?: number;
        genre?: string;
        license?: string;
        platform?: string;
        runtime?: "all" | "browser" | "desktop" | "unavailable";
        search?: string;
      } = {},
      signal?: AbortSignal,
    ) => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search.trim()) params.set("search", search.trim());
      if (platform) params.set("platform", platform);
      if (runtime !== "all") params.set("runtime", runtime);
      if (genre) params.set("genre", genre);
      if (license) params.set("license", license);

      return apiRequest(
        `/games?${params}`,
        { authenticated: false, signal },
        apiPaginatedGamesSchema,
      );
    },
    featuredGames: () =>
      apiRequest(
        "/games/featured",
        { authenticated: false, cache: "no-store" },
        apiFeaturedGamesSchema,
      ),
    game: (gameId: string) =>
      apiRequest(
        `/games/${encodeApiPathSegment(gameId)}`,
        { authenticated: false },
        apiGameResponseSchema,
      ),
    listFavorites: () => apiRequest("/favorites", undefined, favoriteListSchema),
    removeFavorite: async (gameId: string) => {
      const result = await apiRequest(
        `/favorites/${encodeApiPathSegment(gameId)}`,
        { method: "DELETE" },
        voidSchema,
      );
      clearFavoritesCache();
      return result;
    },
    saveFavorite: async (gameId: string) => {
      const result = await apiRequest(
        `/favorites/${encodeApiPathSegment(gameId)}`,
        {
          method: "PUT",
        },
        favoritedSchema,
      );
      clearFavoritesCache();
      return result;
    },
  };
}

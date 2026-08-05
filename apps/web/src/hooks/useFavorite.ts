import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, getAuthSession } from "../lib/api/apiClient";
import { useFavoriteIdsQuery } from "./queryHooks";
import { invalidateFavoriteQueries } from "../lib/api/queryClient";
import {
  getFavoriteSnapshot,
  mutateFavorite,
  replaceFavoriteIds,
  subscribeToFavorites,
} from "../lib/favoriteState";

export function useFavorite(gameId: string) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const snapshot = useSyncExternalStore(
    subscribeToFavorites,
    getFavoriteSnapshot,
    getFavoriteSnapshot,
  );
  const favoriteIdsQuery = useFavoriteIdsQuery();

  useEffect(() => {
    if (favoriteIdsQuery.data) {
      replaceFavoriteIds(favoriteIdsQuery.data);
    }
  }, [favoriteIdsQuery.data]);

  const toggleFavorite = useCallback(async () => {
    const session = await getAuthSession();
    if (!session) {
      navigate("/login");
      return false;
    }

    const favorited = snapshot.ids.has(gameId);
    const result = await mutateFavorite(gameId, !favorited, () =>
      favorited ? api.removeFavorite(gameId) : api.saveFavorite(gameId),
    );
    await invalidateFavoriteQueries(queryClient);
    return result;
  }, [gameId, navigate, queryClient, snapshot.ids]);

  return {
    error: snapshot.error,
    isFavorited: snapshot.ids.has(gameId),
    isPending: snapshot.pendingIds.has(gameId),
    toggleFavorite,
  };
}

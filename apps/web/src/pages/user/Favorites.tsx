import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import GameCard from "../../components/user/GameCard";
import { FavoritesPageSkeleton } from "../../components/ui/Skeleton";
import { PixelIcon } from "../../components/ui/PixelIcon";
import { LibraryGamePicker, type SavedGame } from "../../features/favorites/LibraryGamePicker";
import { replaceFavoriteIds } from "../../lib/favoriteState";
import { useFavoritesQuery } from "../../hooks/queryHooks";
import { queryKeys } from "../../lib/api/queryClient";

export default function Favorites() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const favoritesQuery = useFavoritesQuery<SavedGame>({
    onMissingSession: () => navigate("/login"),
  });
  const favorites = useMemo(
    () => favoritesQuery.data?.favorites || [],
    [favoritesQuery.data?.favorites],
  );
  const loadError = favoritesQuery.isError ? "Could not load your library. Try again." : "";

  useEffect(() => {
    replaceFavoriteIds(new Set(favorites.map((game) => game.id)));
  }, [favorites]);

  const updateFavoriteCache = useCallback(
    (game: SavedGame, favorited: boolean) => {
      queryClient.setQueryData<{ favorites: SavedGame[] }>(queryKeys.favorites(), (current) => {
        const currentFavorites = current?.favorites || [];
        if (!favorited)
          return { favorites: currentFavorites.filter((favorite) => favorite.id !== game.id) };
        if (currentFavorites.some((favorite) => favorite.id === game.id))
          return { favorites: currentFavorites };
        return { favorites: [...currentFavorites, game] };
      });
    },
    [queryClient],
  );

  if (favoritesQuery.isLoading) return <FavoritesPageSkeleton />;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto mt-8 w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <button
          className="mb-8 flex w-fit items-center gap-2 text-gray-400 transition-colors hover:text-synth-primary"
          onClick={() => navigate("/home")}
          type="button"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Home
        </button>
        <div className="mb-10">
          <h1 className="flex items-center gap-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            My Library
          </h1>
        </div>
        {loadError ? (
          <div className="danger-panel rounded-xl border px-4 py-16 text-center font-bold">
            <p>{loadError}</p>
            <button
              className="danger-action mt-4 rounded-lg border px-4 py-2 text-sm font-bold"
              onClick={() => void favoritesQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-32 text-center">
            <PixelIcon className="mx-auto mb-6 h-16 w-16 text-synth-border" name="favorites" />
            <h2 className="mb-2 text-2xl font-bold text-gray-300">No favorites yet</h2>
            <p className="mx-auto mb-8 max-w-md text-gray-500">
              You haven't saved any games to your library. Open the catalog picker to choose your
              first games.
            </p>
            <button
              className="mx-auto flex items-center rounded-lg border border-synth-border bg-synth-bg px-8 py-3 font-bold text-white hover:bg-synth-surface"
              onClick={() => setIsPickerOpen(true)}
              type="button"
            >
              Browse Games
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">
            {favorites.map((game) => (
              <GameCard
                coverUrl={game.cover_url}
                id={game.id}
                key={game.id}
                onFavoriteChange={(favorited) => updateFavoriteCache(game, favorited)}
                title={game.title}
              />
            ))}
            <button
              aria-label="Add games to library"
              className="group flex min-h-[21.25rem] flex-col items-center justify-center rounded-lg border border-dashed border-synth-border bg-synth-surface text-gray-400 hover:border-synth-primary hover:text-white"
              onClick={() => setIsPickerOpen(true)}
              type="button"
            >
              <span className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg border border-synth-border bg-synth-bg">
                <Plus className="h-8 w-8" />
              </span>
              <span className="text-lg font-bold">Add games</span>
            </button>
          </div>
        )}
      </div>
      {isPickerOpen && (
        <LibraryGamePicker
          onClose={() => setIsPickerOpen(false)}
          onFavoriteChange={updateFavoriteCache}
        />
      )}
    </div>
  );
}

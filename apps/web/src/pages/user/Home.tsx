import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import HeroBanner from "../../components/user/HeroBanner";
import GameCard from "../../components/user/GameCard";
import {
  useCatalogFiltersQuery,
  useFeaturedGamesQuery,
  useGameCatalogQuery,
} from "../../lib/api/apiQueries";
import {
  GameGridSkeleton,
  GamesCatalogSkeleton,
  HeroSkeleton,
} from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import type { ApiGame } from "../../lib/api/apiTypes";
import {
  getBrowserGameCompatibility,
  PLATFORM_OPTIONS,
} from "../../features/catalog/browserCompatibility";
import { formatGenre } from "../../features/catalog/catalogMetadata";

const GAMES_PER_PAGE = 15;
const ZERO_PLAY_FEATURED_REFRESH_MS = 30_000;

const hasOnlyZeroPlayCounts = (games: ApiGame[]) =>
  games.length > 1 &&
  games.every((game) => !game.play_count || game.play_count <= 0);

function CatalogRefreshPanel({ label }: { label: string }) {
  return (
    <div className="relative" role="status" aria-label={label}>
      <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-synth-border bg-synth-surface px-3 py-1.5 text-sm font-semibold text-white">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
      <GameGridSkeleton />
    </div>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState<"all" | "browser" | "desktop" | "unavailable">("all");
  const [genreFilter, setGenreFilter] = useState("");
  const [licenseFilter, setLicenseFilter] = useState("");

  const catalogQuery = useGameCatalogQuery({
    page: currentPage,
    pageSize: GAMES_PER_PAGE,
    genre: genreFilter,
    license: licenseFilter,
    platform: platformFilter,
    runtime: runtimeFilter,
    search: searchQuery,
  });
  const featuredQuery = useFeaturedGamesQuery();
  const filtersQuery = useCatalogFiltersQuery();
  const availableGenres = filtersQuery.data?.genres || [];
  const availableLicenses = filtersQuery.data?.licenses || [];

  const games = (catalogQuery.data?.games || []) as ApiGame[];
  const featuredGames = featuredQuery.data?.featuredGames.length
    ? featuredQuery.data.featuredGames
    : (catalogQuery.data?.featuredGames || []);
  const loading = catalogQuery.isLoading;
  const loadError = catalogQuery.isError
    ? "Could not load the game library. Check the API connection."
    : "";
  const totalGames = catalogQuery.data?.total || 0;
  const totalPages = catalogQuery.data?.totalPages || 1;
  const shouldRefreshFeatured = hasOnlyZeroPlayCounts(featuredGames);
  const refetchFeaturedGames = featuredQuery.refetch;

  useEffect(() => {
    if (!shouldRefreshFeatured) return;

    const interval = window.setInterval(() => {
      void refetchFeaturedGames();
    }, ZERO_PLAY_FEATURED_REFRESH_MS);

    return () => window.clearInterval(interval);
  }, [refetchFeaturedGames, shouldRefreshFeatured]);

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * GAMES_PER_PAGE;
  const showInitialCatalogSkeleton = loading && games.length === 0 && !searchQuery;
  const showCatalogRefreshPanel =
    catalogQuery.isFetching &&
    (games.length > 0 || Boolean(searchQuery));
  const catalogRefreshLabel = searchQuery
    ? "Searching games..."
    : "Loading games...";

  const changePage = (page: number) => {
    setCurrentPage(page);
    document
      .getElementById("all-games")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {loading && featuredGames.length === 0 ? (
        <HeroSkeleton />
      ) : (
        <HeroBanner featuredGames={featuredGames} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="all-games"
            className="scroll-mt-24 text-2xl font-bold text-white"
          >
            All Games
          </h2>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-5 lg:max-w-5xl">
            <div className="relative sm:col-span-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full rounded-lg border border-synth-border bg-synth-bg py-2 pl-10 pr-3 leading-5 text-white placeholder:text-gray-500 transition-colors focus:border-synth-secondary focus:outline-none"
              />
            </div>
            <label>
              <span className="sr-only">Runtime availability</span>
              <select
                className="block w-full rounded-lg border border-synth-border bg-synth-bg px-3 py-2 text-white focus:border-synth-secondary focus:outline-none"
                onChange={(event) => {
                  setRuntimeFilter(event.target.value as typeof runtimeFilter);
                  setCurrentPage(1);
                }}
                value={runtimeFilter}
              >
                <option value="all">All runtimes</option>
                <option value="browser">Play in browser</option>
                <option value="desktop">Desktop required</option>
                <option value="unavailable">Currently unavailable</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Game system</span>
              <select
                className="block w-full rounded-lg border border-synth-border bg-synth-bg px-3 py-2 text-white focus:border-synth-secondary focus:outline-none"
                onChange={(event) => {
                  setPlatformFilter(event.target.value);
                  setCurrentPage(1);
                }}
                value={platformFilter}
              >
                <option value="">All systems</option>
                {PLATFORM_OPTIONS.map((platform) => (
                  <option key={platform.id} value={platform.id}>{platform.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Game genre</span>
              <select
                className="block w-full rounded-lg border border-synth-border bg-synth-bg px-3 py-2 text-white focus:border-synth-secondary focus:outline-none"
                onChange={(event) => {
                  setGenreFilter(event.target.value);
                  setCurrentPage(1);
                }}
                value={genreFilter}
              >
                <option value="">All genres</option>
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>{formatGenre(genre)}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Game license</span>
              <select
                className="block w-full rounded-lg border border-synth-border bg-synth-bg px-3 py-2 text-white focus:border-synth-secondary focus:outline-none"
                onChange={(event) => {
                  setLicenseFilter(event.target.value);
                  setCurrentPage(1);
                }}
                value={licenseFilter}
              >
                <option value="">All licenses</option>
                {availableLicenses.map((license) => (
                  <option key={license} value={license}>{license}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {showInitialCatalogSkeleton ? (
          <GamesCatalogSkeleton />
        ) : showCatalogRefreshPanel ? (
          <CatalogRefreshPanel label={catalogRefreshLabel} />
        ) : loadError ? (
          <div className="danger-panel rounded-lg border px-4 py-8 text-center font-bold">
            <p>{loadError}</p>
            <button
              className="danger-action mt-4 rounded-lg border px-4 py-2 text-sm font-bold transition-colors"
              onClick={() => void catalogQuery.refetch()}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : games.length === 0 && !loading && !catalogQuery.isFetching ? (
          <div className="text-center py-20 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-xl">
              {searchQuery
                ? `No games found matching “${searchQuery}” with these filters.`
                : "No games match the selected runtime, system, genre, and license filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {games.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                title={game.title}
                coverUrl={game.cover_url}
                compatibility={getBrowserGameCompatibility(game)}
              />
            ))}
          </div>
        )}

        {!loadError && games.length > 0 && totalPages > 1 && (
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing {pageStart + 1}-
              {Math.min(pageStart + games.length, totalGames)} of {totalGames}
            </p>

            <Pagination
              currentPage={safeCurrentPage}
              onPageChange={changePage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
}

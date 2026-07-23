import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";
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
import { AdminSelect } from "../../components/ui/AdminSelect";
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
  const hasActiveFilters = Boolean(
    searchQuery ||
      platformFilter ||
      runtimeFilter !== "all" ||
      genreFilter ||
      licenseFilter,
  );

  const changePage = (page: number) => {
    setCurrentPage(page);
    document
      .getElementById("all-games")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setPlatformFilter("");
    setRuntimeFilter("all");
    setGenreFilter("");
    setLicenseFilter("");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {loading && featuredGames.length === 0 ? (
        <HeroSkeleton />
      ) : (
        <HeroBanner featuredGames={featuredGames} />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {!showInitialCatalogSkeleton && (
          <div className="mb-8 space-y-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <h2
                id="all-games"
                className="scroll-mt-24 text-2xl font-bold text-white"
              >
                All Games
              </h2>

              <div className="grid w-full xl:max-w-4xl xl:grid-cols-4">
                <div className="relative w-full xl:col-span-2 xl:col-start-3">
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
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-synth-secondary/40 bg-synth-bg px-4 text-sm font-semibold text-white transition-colors hover:border-synth-secondary hover:bg-synth-elevated disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-synth-bg"
                disabled={!hasActiveFilters}
                onClick={resetFilters}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Reset filters
              </button>
              <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-4xl xl:grid-cols-4">
                <AdminSelect
                  ariaLabel="Runtime availability"
                  className="w-full"
                  onChange={(value) => {
                    setRuntimeFilter(value as typeof runtimeFilter);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: "All runtimes", value: "all" },
                    { label: "Play in browser", value: "browser" },
                    { label: "Desktop required", value: "desktop" },
                    { label: "Currently unavailable", value: "unavailable" },
                  ]}
                  value={runtimeFilter}
                />
                <AdminSelect
                  ariaLabel="Game system"
                  className="w-full"
                  onChange={(value) => {
                    setPlatformFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: "All systems", value: "" },
                    ...PLATFORM_OPTIONS.map((platform) => ({
                      label: platform.label,
                      value: platform.id,
                    })),
                  ]}
                  value={platformFilter}
                />
                <AdminSelect
                  ariaLabel="Game genre"
                  className="w-full"
                  onChange={(value) => {
                    setGenreFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: "All genres", value: "" },
                    ...availableGenres.map((genre) => ({
                      label: formatGenre(genre),
                      value: genre,
                    })),
                  ]}
                  value={genreFilter}
                />
                <AdminSelect
                  ariaLabel="Game license"
                  className="w-full"
                  onChange={(value) => {
                    setLicenseFilter(value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: "All licenses", value: "" },
                    ...availableLicenses.map((license) => ({
                      label: license,
                      value: license,
                    })),
                  ]}
                  value={licenseFilter}
                />
              </div>
            </div>
          </div>
        )}

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

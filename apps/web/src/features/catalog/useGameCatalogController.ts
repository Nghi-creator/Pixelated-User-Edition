import { useEffect, useMemo, useState } from "react";
import type { ApiGame } from "../../lib/api/apiTypes";
import {
  useCatalogFiltersQuery,
  useFeaturedGamesQuery,
  useGameCatalogQuery,
} from "../../hooks/queryHooks";

export const GAMES_PER_PAGE = 15;
const ZERO_PLAY_FEATURED_REFRESH_MS = 30_000;

export function useGameCatalogController() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState("");
  const [runtimeFilter, setRuntimeFilter] = useState<"all" | "browser" | "desktop" | "unavailable">(
    "all",
  );
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
  const games = (catalogQuery.data?.games || []) as ApiGame[];
  const featuredGames = useMemo(
    () =>
      featuredQuery.data?.featuredGames.length
        ? featuredQuery.data.featuredGames
        : catalogQuery.data?.featuredGames || [],
    [catalogQuery.data, featuredQuery.data],
  );
  const refetchFeatured = featuredQuery.refetch;
  const totalGames = catalogQuery.data?.total || 0;
  const totalPages = catalogQuery.data?.totalPages || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const shouldRefresh =
      featuredGames.length > 1 &&
      featuredGames.every((game) => !game.play_count || game.play_count <= 0);
    if (!shouldRefresh) return;
    const interval = window.setInterval(
      () => void refetchFeatured(),
      ZERO_PLAY_FEATURED_REFRESH_MS,
    );
    return () => window.clearInterval(interval);
  }, [featuredGames, refetchFeatured]);

  const changePage = (page: number) => {
    setCurrentPage(page);
    document.getElementById("all-games")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setPlatformFilter("");
    setRuntimeFilter("all");
    setGenreFilter("");
    setLicenseFilter("");
    setCurrentPage(1);
  };
  const updateFilter = <T>(setter: (value: T) => void, value: T) => {
    setter(value);
    setCurrentPage(1);
  };

  return {
    availableGenres: filtersQuery.data?.genres || [],
    availableLicenses: filtersQuery.data?.licenses || [],
    catalogQuery,
    changePage,
    currentPage: safeCurrentPage,
    featuredGames,
    games,
    genreFilter,
    hasActiveFilters: Boolean(
      searchInput || platformFilter || runtimeFilter !== "all" || genreFilter || licenseFilter,
    ),
    licenseFilter,
    loading: catalogQuery.isLoading,
    pageStart: (safeCurrentPage - 1) * GAMES_PER_PAGE,
    platformFilter,
    resetFilters,
    runtimeFilter,
    searchInput,
    searchQuery,
    setGenreFilter: (value: string) => updateFilter(setGenreFilter, value),
    setLicenseFilter: (value: string) => updateFilter(setLicenseFilter, value),
    setPlatformFilter: (value: string) => updateFilter(setPlatformFilter, value),
    setRuntimeFilter: (value: typeof runtimeFilter) => updateFilter(setRuntimeFilter, value),
    setSearchInput,
    totalGames,
    totalPages,
  };
}

import HeroBanner from "../../components/user/HeroBanner";
import { HeroSkeleton } from "../../components/ui/Skeleton";
import { GameCatalogResults } from "../../features/catalog/GameCatalogResults";
import { GameCatalogToolbar } from "../../features/catalog/GameCatalogToolbar";
import { useGameCatalogController } from "../../features/catalog/useGameCatalogController";

export default function Home() {
  const catalog = useGameCatalogController();
  const showToolbar = !(catalog.loading && catalog.games.length === 0 && !catalog.searchQuery);
  return (
    <div className="flex min-h-screen flex-col">
      {catalog.loading && catalog.featuredGames.length === 0 ? <HeroSkeleton /> : <HeroBanner featuredGames={catalog.featuredGames} />}
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {showToolbar && <GameCatalogToolbar availableGenres={catalog.availableGenres} availableLicenses={catalog.availableLicenses} genre={catalog.genreFilter} hasActiveFilters={catalog.hasActiveFilters} license={catalog.licenseFilter} onGenreChange={catalog.setGenreFilter} onLicenseChange={catalog.setLicenseFilter} onPlatformChange={catalog.setPlatformFilter} onReset={catalog.resetFilters} onRuntimeChange={catalog.setRuntimeFilter} onSearchChange={catalog.setSearchInput} platform={catalog.platformFilter} runtime={catalog.runtimeFilter} search={catalog.searchInput} />}
        <GameCatalogResults currentPage={catalog.currentPage} games={catalog.games} isError={catalog.catalogQuery.isError} isFetching={catalog.catalogQuery.isFetching} isLoading={catalog.loading} onPageChange={catalog.changePage} onRetry={() => void catalog.catalogQuery.refetch()} pageStart={catalog.pageStart} searchQuery={catalog.searchQuery} totalGames={catalog.totalGames} totalPages={catalog.totalPages} />
      </div>
    </div>
  );
}

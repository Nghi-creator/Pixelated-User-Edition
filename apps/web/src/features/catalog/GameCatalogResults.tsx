import { Loader2, Search } from "lucide-react";
import GameCard from "../../components/user/GameCard";
import { GameGridSkeleton, GamesCatalogSkeleton } from "../../components/ui/Skeleton";
import { Pagination } from "../../components/ui/Pagination";
import type { ApiGame } from "../../lib/api/apiTypes";
import { getBrowserGameCompatibility } from "./browserCompatibility";

type Props = {
  currentPage: number; games: ApiGame[]; isError: boolean; isFetching: boolean; isLoading: boolean;
  onPageChange: (page: number) => void; onRetry: () => void; pageStart: number; searchQuery: string;
  totalGames: number; totalPages: number;
};

function CatalogRefreshPanel({ label }: { label: string }) {
  return <div className="relative" role="status" aria-label={label}><div className="mb-4 inline-flex items-center gap-2 rounded-md border border-synth-border bg-synth-surface px-3 py-1.5 text-sm font-semibold text-white"><Loader2 className="h-4 w-4 animate-spin" />{label}</div><GameGridSkeleton /></div>;
}

export function GameCatalogResults(props: Props) {
  const showInitialSkeleton = props.isLoading && props.games.length === 0 && !props.searchQuery;
  const showRefresh = props.isFetching && (props.games.length > 0 || Boolean(props.searchQuery));
  let content;
  if (showInitialSkeleton) content = <GamesCatalogSkeleton />;
  else if (showRefresh) content = <CatalogRefreshPanel label={props.searchQuery ? "Searching games..." : "Loading games..."} />;
  else if (props.isError) content = <div className="danger-panel rounded-lg border px-4 py-8 text-center font-bold"><p>Could not load the game library. Check the API connection.</p><button className="danger-action mt-4 rounded-lg border px-4 py-2 text-sm font-bold" onClick={props.onRetry} type="button">Retry</button></div>;
  else if (props.games.length === 0) content = <div className="py-20 text-center text-gray-500"><Search className="mx-auto mb-4 h-12 w-12 opacity-20" /><p className="text-xl">{props.searchQuery ? `No games found matching “${props.searchQuery}” with these filters.` : "No games match the selected runtime, system, genre, and license filters."}</p></div>;
  else content = <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-5">{props.games.map((game) => <GameCard compatibility={getBrowserGameCompatibility(game)} coverUrl={game.cover_url} id={game.id} key={game.id} title={game.title} />)}</div>;

  return <>{content}{!props.isError && props.games.length > 0 && props.totalPages > 1 && <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-gray-500">Showing {props.pageStart + 1}-{Math.min(props.pageStart + props.games.length, props.totalGames)} of {props.totalGames}</p><Pagination currentPage={props.currentPage} onPageChange={props.onPageChange} totalPages={props.totalPages} /></div>}</>;
}

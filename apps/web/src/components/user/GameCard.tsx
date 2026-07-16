import { Heart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useFavorite } from "../../features/favorites/useFavorite";
import {
  GameArtworkFallback,
} from "./GameArtworkFallback";
import { isGeneratedCatalogArtworkUrl } from "./gameArtworkUtils";
import type { BrowserGameCompatibility } from "../../features/catalog/browserCompatibility";

interface GameCardProps {
  id: string;
  onFavoriteChange?: (favorited: boolean) => void;
  title: string;
  coverUrl: string;
  compatibility?: BrowserGameCompatibility;
}

export default function GameCard({
  id,
  onFavoriteChange,
  title,
  coverUrl,
  compatibility,
}: GameCardProps) {
  const [coverFailed, setCoverFailed] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const {
    isFavorited,
    isPending,
    toggleFavorite: toggleFavoriteState,
  } = useFavorite(id);
  const showCover =
    Boolean(coverUrl) &&
    !coverFailed &&
    !isGeneratedCatalogArtworkUrl(coverUrl);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;

    setFavoriteError("");
    try {
      const changed = await toggleFavoriteState();
      if (changed) onFavoriteChange?.(!isFavorited);
    } catch {
      setFavoriteError("Could not update favorite.");
    }
  };

  return (
    <Link
      to={`/play/${id}`}
      className="group relative block overflow-hidden rounded-lg border border-synth-border bg-synth-surface transition-colors hover:bg-synth-elevated"
    >
      <div className="overflow-hidden bg-synth-bg">
        {showCover ? (
          <img
            src={coverUrl}
            alt={title}
            onError={() => setCoverFailed(true)}
            className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] md:h-72"
          />
        ) : (
          <GameArtworkFallback
            className="h-64 transition-transform duration-300 group-hover:scale-[1.03] md:h-72"
            title={title}
          />
        )}
      </div>

      {compatibility && (
        <div
          className={`absolute left-2 top-2 rounded-md border px-2 py-1 text-[11px] font-black uppercase tracking-wide backdrop-blur-sm ${
            compatibility.kind === "browser"
              ? "border-emerald-400/50 bg-emerald-950/90 text-emerald-200"
              : compatibility.kind === "desktop"
                ? "border-amber-400/50 bg-amber-950/90 text-amber-100"
                : "border-red-400/50 bg-red-950/90 text-red-200"
          }`}
          title={compatibility.reason}
        >
          {compatibility.label}
        </div>
      )}

      <button
        onClick={toggleFavorite}
        aria-label={isFavorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        disabled={isPending}
        title={favoriteError || undefined}
        className="absolute right-2 top-2 z-10 rounded-md border border-synth-border bg-synth-surface p-2 text-white transition-colors hover:bg-synth-elevated focus:outline-none disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <Heart
            className={`w-5 h-5 transition-colors ${isFavorited ? "fill-white text-white" : "text-white/80 hover:text-white"}`}
          />
        )}
      </button>

      <div className="border-t border-synth-border p-3">
        <h3 className="font-bold text-lg truncate text-white">{title}</h3>
        {compatibility && (
          <p className="mt-1 truncate text-xs font-semibold text-gray-400">
            {compatibility.platformLabel}
          </p>
        )}
      </div>
    </Link>
  );
}

type CatalogBuild = {
  artifact_filename: string | null;
  artifact_sha256?: string | null;
  artifact_size?: number | null;
  enabled: boolean;
  platform_id: string;
  runtime_kind: "libretro" | "native_linux";
};

type CatalogGame = {
  game_builds: CatalogBuild[];
};

export type CatalogRuntimeFilter = "all" | "browser" | "desktop" | "unavailable";
export type CatalogCompatibility = "browser" | "desktop" | "unavailable";

export function getCatalogCompatibility(game: CatalogGame): CatalogCompatibility {
  const build = game.game_builds.find((candidate) => candidate.enabled);
  if (!build) return "unavailable";
  if (build.runtime_kind === "native_linux") return "desktop";

  const hasVerifiedArtifact =
    Boolean(build.artifact_filename) &&
    typeof build.artifact_size === "number" &&
    Number.isFinite(build.artifact_size) &&
    build.artifact_size > 0 &&
    /^[a-f0-9]{64}$/i.test(build.artifact_sha256 || "");
  if (!hasVerifiedArtifact) return "unavailable";

  return build.platform_id === "nes" && build.artifact_filename?.toLowerCase().endsWith(".nes")
    ? "browser"
    : "desktop";
}

export function filterCatalogGames<TGame extends CatalogGame>(
  games: TGame[],
  filters: { platform?: string; runtime?: CatalogRuntimeFilter },
) {
  return games.filter((game) => {
    const build = game.game_builds.find((candidate) => candidate.enabled);
    if (filters.platform && build?.platform_id !== filters.platform) return false;
    if (filters.runtime && filters.runtime !== "all") {
      return getCatalogCompatibility(game) === filters.runtime;
    }
    return true;
  });
}

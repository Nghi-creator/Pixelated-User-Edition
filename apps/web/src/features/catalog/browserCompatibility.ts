import type { ApiGame } from "../../lib/api/apiTypes";

export type BrowserCompatibilityKind = "browser" | "desktop" | "unavailable";

export type BrowserGameCompatibility = {
  kind: BrowserCompatibilityKind;
  label: string;
  platformId: string | null;
  platformLabel: string;
  reason: string;
};

export const PLATFORM_OPTIONS = [
  { id: "nes", label: "NES" },
  { id: "gb", label: "Game Boy" },
  { id: "gbc", label: "Game Boy Color" },
  { id: "gba", label: "Game Boy Advance" },
  { id: "snes", label: "Super Nintendo" },
  { id: "genesis", label: "Genesis / Mega Drive" },
  { id: "sms", label: "Master System" },
  { id: "game_gear", label: "Game Gear" },
  { id: "linux", label: "Linux" },
] as const;

export function getPlatformLabel(platformId: string | null | undefined) {
  if (!platformId) return "Unknown system";
  return PLATFORM_OPTIONS.find((platform) => platform.id === platformId)?.label ||
    platformId.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getBrowserGameCompatibility(game: ApiGame | null | undefined): BrowserGameCompatibility {
  const build = game?.game_builds?.find((candidate) => candidate.enabled);
  const platformId = build?.platform_id || null;
  const platformLabel = getPlatformLabel(platformId);

  if (!build) {
    return {
      kind: "unavailable",
      label: "Currently unavailable",
      platformId,
      platformLabel,
      reason: "This game does not have an approved playable build yet.",
    };
  }
  if (build.runtime_kind === "native_linux") {
    return {
      kind: "desktop",
      label: "Desktop required",
      platformId,
      platformLabel,
      reason: "This native Linux game requires Pixelated Studio Edition and cannot run in a hosted browser.",
    };
  }

  const hasVerifiedArtifact =
    Boolean(build.artifact_filename) &&
    typeof build.artifact_size === "number" &&
    Number.isFinite(build.artifact_size) &&
    build.artifact_size > 0 &&
    /^[a-f0-9]{64}$/i.test(build.artifact_sha256 || "");
  if (!hasVerifiedArtifact) {
    return {
      kind: "unavailable",
      label: "Currently unavailable",
      platformId,
      platformLabel,
      reason: "This build is missing the verified browser artifact metadata required for a safe launch.",
    };
  }

  if (platformId === "nes" && build.artifact_filename?.toLowerCase().endsWith(".nes")) {
    return {
      kind: "browser",
      label: "Play in browser",
      platformId,
      platformLabel,
      reason: "This verified NES build can run locally in your browser with WebAssembly.",
    };
  }

  return {
    kind: "desktop",
    label: "Desktop required",
    platformId,
    platformLabel,
    reason: `${platformLabel} browser support is not included in the current NES-only WASM release.`,
  };
}

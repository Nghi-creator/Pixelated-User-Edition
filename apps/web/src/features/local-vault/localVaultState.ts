export const LOCAL_VAULT_EXTENSIONS = [
  ".nes",
  ".gb",
  ".gbc",
  ".gba",
  ".sfc",
  ".smc",
  ".md",
  ".gen",
  ".sms",
  ".gg",
];
export const MAX_LOCAL_ROM_BYTES = 64 * 1024 * 1024;
export type LocalRomSystemId =
  | "nes"
  | "gb"
  | "gbc"
  | "gba"
  | "snes"
  | "genesis"
  | "sms"
  | "game_gear";

export const LOCAL_ROM_SYSTEMS: readonly {
  extensions: readonly string[];
  id: LocalRomSystemId;
  label: string;
}[] = [
  { extensions: [".nes"], id: "nes", label: "NES" },
  { extensions: [".gb"], id: "gb", label: "Game Boy" },
  { extensions: [".gbc"], id: "gbc", label: "Game Boy Color" },
  { extensions: [".gba"], id: "gba", label: "Game Boy Advance" },
  { extensions: [".sfc", ".smc"], id: "snes", label: "Super Nintendo" },
  { extensions: [".md", ".gen"], id: "genesis", label: "Genesis / Mega Drive" },
  { extensions: [".sms"], id: "sms", label: "Master System" },
  { extensions: [".gg"], id: "game_gear", label: "Game Gear" },
];
export const INVALID_ENGINE_TOKEN_MESSAGE =
  "The saved pairing token was rejected. Enter the current desktop token to reconnect.";
export const LOCAL_ENGINE_UNREACHABLE_MESSAGE =
  "Local engine is unreachable. Check the desktop app and engine URL.";

export type LocalVaultGame = {
  id: string;
  title: string;
};

export class InvalidEngineTokenError extends Error {
  constructor() {
    super(INVALID_ENGINE_TOKEN_MESSAGE);
    this.name = "InvalidEngineTokenError";
  }
}

export function validateLocalRomFile(file: Pick<File, "name" | "size"> | null) {
  if (!file) return "Choose a supported ROM file first.";
  if (file.size <= 0) return "The selected ROM file is empty.";
  const lowerFilename = file.name.toLowerCase();
  if (!LOCAL_VAULT_EXTENSIONS.some((extension) => lowerFilename.endsWith(extension))) {
    return "Only .nes, .gb, .gbc, .gba, .sfc, .smc, .md, .gen, .sms, and .gg files are supported.";
  }
  if (file.size > MAX_LOCAL_ROM_BYTES) {
    return "ROM files must be 64 MB or smaller.";
  }
  return null;
}

export function detectLocalRomSystem(filename: string) {
  const lowerFilename = filename.toLowerCase();
  return LOCAL_ROM_SYSTEMS.find((system) =>
    system.extensions.some((extension) => lowerFilename.endsWith(extension)),
  ) || null;
}

export async function inspectLocalRomFile(
  file: Pick<File, "arrayBuffer" | "name" | "size">,
) {
  const validationError = validateLocalRomFile(file as File);
  if (validationError) throw new Error(validationError);
  const system = detectLocalRomSystem(file.name);
  if (!system) throw new Error("Could not identify this ROM system.");

  if (system.id === "nes") {
    const header = new Uint8Array((await file.arrayBuffer()).slice(0, 16));
    if (
      header.byteLength < 16 ||
      header[0] !== 0x4e ||
      header[1] !== 0x45 ||
      header[2] !== 0x53 ||
      header[3] !== 0x1a
    ) {
      throw new Error("The selected file does not have a valid NES ROM header.");
    }
  }

  return {
    browserPlayable: Boolean(findWasmCoreForArtifact(system.id, file.name)),
    system,
  };
}

export function getLocalGameTitle(filename: string) {
  return filename.replace(/\.(nes|gb|gbc|gba|sfc|smc|md|gen|sms|gg)$/i, "");
}

export function getLocalGamePlayPath(filename: string) {
  return `/play/${encodeURIComponent(filename)}`;
}

export function normalizeLocalGameFilenames(payload: unknown) {
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((filename): filename is string => typeof filename === "string")
    .filter((filename) => {
      const lowerFilename = filename.toLowerCase();
      return LOCAL_VAULT_EXTENSIONS.some((extension) =>
        lowerFilename.endsWith(extension),
      );
    });
}

export function toLocalVaultGames(filenames: string[]): LocalVaultGame[] {
  return filenames.map((filename) => ({
    id: filename,
    title: getLocalGameTitle(filename),
  }));
}

export function getLocalVaultErrorMessage(error: unknown, fallback: string) {
  if (error instanceof InvalidEngineTokenError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function isInvalidEngineTokenError(
  error: unknown,
): error is InvalidEngineTokenError {
  return error instanceof InvalidEngineTokenError;
}
import { findWasmCoreForArtifact } from "../../lib/runtime/wasm/coreRegistry.ts";

import type { GameRuntime } from "../gameRuntime.ts";

export type WasmPlayerStatus =
  | "idle"
  | "preparing"
  | "downloading"
  | "verifying"
  | "loading-core"
  | "starting"
  | "playing"
  | "paused"
  | "stopped"
  | "error";

export type WasmRuntimePhase = "downloading" | "verifying" | "loading-core" | "ready";

export type WasmRuntimeProgress = {
  loadedBytes: number;
  phase: WasmRuntimePhase;
  totalBytes: number | null;
};

export type WasmRuntimeFactoryOptions = {
  canvas: HTMLCanvasElement;
  onProgress?: (progress: WasmRuntimeProgress) => void;
};

export type WasmRuntimeFactory = (options: WasmRuntimeFactoryOptions) => Promise<GameRuntime>;

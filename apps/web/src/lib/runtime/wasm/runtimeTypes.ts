import type { GameRuntime } from "../gameRuntime.ts";

export type WasmRuntimePhase =
  | "downloading"
  | "verifying"
  | "loading-core"
  | "ready";

export type WasmRuntimeProgress = {
  loadedBytes: number;
  phase: WasmRuntimePhase;
  totalBytes: number | null;
};

export type WasmRuntimeFactoryOptions = {
  canvas: HTMLCanvasElement;
  onProgress?: (progress: WasmRuntimeProgress) => void;
};

export type WasmRuntimeFactory = (
  options: WasmRuntimeFactoryOptions,
) => Promise<GameRuntime>;

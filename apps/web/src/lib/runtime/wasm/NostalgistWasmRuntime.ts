import type { Nostalgist } from "nostalgist";
import type { GameRuntime, GameRuntimeSource } from "../gameRuntime.ts";
import { MAX_NES_ROM_BYTES, validateNesRom } from "./romValidation.ts";

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

type NostalgistInstance = Pick<
  Nostalgist,
  | "exit"
  | "getStatus"
  | "loadState"
  | "pause"
  | "pressDown"
  | "pressUp"
  | "restart"
  | "resume"
  | "saveSRAM"
  | "saveState"
  | "sendCommand"
  | "start"
>;

type NostalgistModule = {
  Nostalgist: {
    prepare(options: Parameters<typeof Nostalgist.prepare>[0]): Promise<NostalgistInstance>;
  };
};

type RuntimeOptions = {
  canvas: HTMLCanvasElement;
  loadNostalgist?: () => Promise<NostalgistModule>;
  onProgress?: (progress: WasmRuntimeProgress) => void;
};

const defaultLoader = () => import("nostalgist") as Promise<NostalgistModule>;

async function downloadRom(
  source: GameRuntimeSource,
  signal: AbortSignal,
  onProgress?: RuntimeOptions["onProgress"],
) {
  if (source.file) {
    if (source.file.size > MAX_NES_ROM_BYTES) {
      throw new Error("The game is larger than the 64 MB browser safety limit.");
    }
    const bytes = new Uint8Array(await source.file.arrayBuffer());
    if (signal.aborted) throw new DOMException("Launch cancelled", "AbortError");
    onProgress?.({
      loadedBytes: bytes.byteLength,
      phase: "downloading",
      totalBytes: bytes.byteLength,
    });
    return bytes;
  }
  if (!source.url) throw new Error("The game source is missing.");

  let response: Response;
  try {
    response = await fetch(source.url, { cache: "no-store", signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error(
      "The ROM download was blocked or unavailable. Check artifact CORS and try again.",
    );
  }
  if (!response.ok) {
    throw new Error(`The ROM download failed with HTTP ${response.status}.`);
  }

  const headerSize = Number(response.headers.get("content-length"));
  const totalBytes = Number.isFinite(headerSize) && headerSize > 0
    ? headerSize
    : source.expectedSize || null;
  if (totalBytes && totalBytes > MAX_NES_ROM_BYTES) {
    throw new Error("The game is larger than the 64 MB browser safety limit.");
  }
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress?.({ loadedBytes: bytes.byteLength, phase: "downloading", totalBytes });
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loadedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    loadedBytes += value.byteLength;
    if (loadedBytes > MAX_NES_ROM_BYTES) {
      await reader.cancel();
      throw new Error("The game is larger than the 64 MB browser safety limit.");
    }
    chunks.push(value);
    onProgress?.({ loadedBytes, phase: "downloading", totalBytes });
  }

  const bytes = new Uint8Array(loadedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export class NostalgistWasmRuntime implements GameRuntime {
  private abortController: AbortController | null = null;
  private instance: NostalgistInstance | null = null;
  private muted = false;
  private readonly options: RuntimeOptions;
  private volumeStep = 60;

  constructor(options: RuntimeOptions) {
    this.options = options;
  }

  async prepare(source: GameRuntimeSource) {
    this.stop();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.options.onProgress?.({ loadedBytes: 0, phase: "downloading", totalBytes: source.expectedSize || source.file?.size || null });
    const bytes = await downloadRom(source, signal, this.options.onProgress);
    this.options.onProgress?.({ loadedBytes: bytes.byteLength, phase: "verifying", totalBytes: bytes.byteLength });
    await validateNesRom(bytes, source);
    if (signal.aborted) throw new DOMException("Launch cancelled", "AbortError");

    this.options.onProgress?.({ loadedBytes: bytes.byteLength, phase: "loading-core", totalBytes: bytes.byteLength });
    const { Nostalgist: NostalgistApi } = await (this.options.loadNostalgist || defaultLoader)();
    const instance = await NostalgistApi.prepare({
      cache: { core: true, rom: false },
      core: "fceumm",
      element: this.options.canvas,
      respondToGlobalEvents: true,
      retroarchConfig: {
        audio_volume: 0,
        input_joypad_driver: "sdl2",
        savestate_thumbnail_enable: true,
        video_smooth: false,
      },
      rom: {
        fileContent: new Blob([bytes], { type: "application/octet-stream" }),
        fileName: source.fileName,
      },
      runEmulatorManually: true,
      signal,
      size: "auto",
    });
    if (signal.aborted) {
      instance.exit({ removeCanvas: false });
      throw new DOMException("Launch cancelled", "AbortError");
    }
    this.instance = instance;
    this.options.onProgress?.({ loadedBytes: bytes.byteLength, phase: "ready", totalBytes: bytes.byteLength });
  }

  async start() {
    if (!this.instance) throw new Error("The WASM runtime has not been prepared.");
    await this.instance.start();
  }

  pause() {
    if (this.instance?.getStatus() === "running") this.instance.pause();
  }

  resume() {
    if (this.instance?.getStatus() === "paused") this.instance.resume();
  }

  reset() {
    this.instance?.restart();
  }

  async captureState() {
    if (!this.instance) throw new Error("Start the game before saving a state.");
    const { state, thumbnail } = await this.instance.saveState();
    return { state, thumbnail };
  }

  async restoreState(state: Blob) {
    if (!this.instance) throw new Error("Start the game before loading a state.");
    await this.instance.loadState(state);
  }

  async captureBatterySave() {
    if (!this.instance) throw new Error("Start the game before backing up battery RAM.");
    return this.instance.saveSRAM();
  }

  pressInput(button: string) {
    this.instance?.pressDown(button);
  }

  releaseInput(button: string) {
    this.instance?.pressUp(button);
  }

  setMuted(muted: boolean) {
    if (!this.instance || muted === this.muted) return;
    this.instance.sendCommand("MUTE");
    this.muted = muted;
  }

  setVolume(volume: number) {
    if (!this.instance) return;
    const nextStep = Math.round(Math.min(1, Math.max(0, volume)) * 60);
    const command = nextStep > this.volumeStep ? "VOLUME_UP" : "VOLUME_DOWN";
    const count = Math.abs(nextStep - this.volumeStep);
    for (let index = 0; index < count; index += 1) this.instance.sendCommand(command);
    this.volumeStep = nextStep;
  }

  stop() {
    this.abortController?.abort();
    this.abortController = null;
    this.instance?.exit({ removeCanvas: false });
    this.instance = null;
    this.muted = false;
    this.volumeStep = 60;
  }
}

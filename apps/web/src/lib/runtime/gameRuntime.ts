export type GameRuntimeSource = {
  expectedSha256?: string | null;
  expectedSize?: number | null;
  fileName: string;
  file?: Blob;
  url?: string;
};

export interface GameRuntime {
  prepare(source: GameRuntimeSource): Promise<void>;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  reset(): void;
  stop(): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
}

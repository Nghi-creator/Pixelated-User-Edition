import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api/apiClient";
import type {
  GameRuntime,
  GameRuntimeSource,
} from "../../../lib/runtime/gameRuntime";
import { getWasmBrowserSupport } from "../../../lib/runtime/wasm/browserSupport";
import { resolveWasmCore } from "../../../lib/runtime/wasm/coreRegistry";
import type { WasmRuntimeProgress } from "../../../lib/runtime/wasm/runtimeTypes";
import { useWasmInputBindings } from "../input/useWasmInputBindings";

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

function createClientSessionId() {
  const randomPart = globalThis.crypto.randomUUID
    ? globalThis.crypto.randomUUID().replaceAll("-", "")
    : Math.random().toString(36).slice(2);
  return `wasm_${Date.now().toString(36)}_${randomPart}`.slice(0, 80);
}

function getLaunchError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Game launch was cancelled.";
    if (error.name === "NotAllowedError") {
      return "The browser blocked game audio. Allow audio for this site and press Retry.";
    }
    return error.message;
  }
  return "The browser emulator could not start this game.";
}

export function useWasmPlayer(gameId: string | undefined) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const generationRef = useRef(0);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [progress, setProgress] = useState<WasmRuntimeProgress | null>(null);
  const [status, setStatus] = useState<WasmPlayerStatus>("idle");
  const [volume, setVolumeState] = useState(1);

  const releaseSession = useCallback(() => {
    const sessionId = sessionIdRef.current;
    sessionIdRef.current = null;
    if (sessionId) {
      void api.stopSession(sessionId).catch((sessionError) => {
        console.warn("Failed to stop WASM backend session:", sessionError);
      });
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    releaseSession();
    setProgress(null);
    setStatus("stopped");
  }, [releaseSession]);

  const start = useCallback(async () => {
    if (!gameId || !canvasRef.current) return;
    const support = getWasmBrowserSupport();
    if (!support.supported) {
      setError(support.reason);
      setStatus("error");
      return;
    }

    const generation = ++generationRef.current;
    runtimeRef.current?.stop();
    releaseSession();
    setError(null);
    setProgress(null);
    setStatus("preparing");

    try {
      const backendSession = await api.createSession(gameId, createClientSessionId());
      if (generation !== generationRef.current) return;
      sessionIdRef.current = backendSession.sessionId;
      if (backendSession.boot.runtimeKind !== "libretro") {
        throw new Error("This game requires the native Studio runtime and cannot run in WASM.");
      }
      if (!backendSession.boot.romUrl) {
        throw new Error("This game does not have a browser-accessible ROM artifact.");
      }
      if (!backendSession.boot.romFilename) {
        throw new Error("This game does not have a browser ROM filename.");
      }
      if (!backendSession.boot.browser.eligible) {
        throw new Error(backendSession.boot.browser.reason || "This game is not eligible for browser play.");
      }
      const core = resolveWasmCore(
        backendSession.boot.browser.coreId,
        backendSession.boot.browser.systemId,
        backendSession.boot.romFilename,
      );
      if (!core) throw new Error("This browser build requires an unsupported emulator core.");

      setStatus("loading-core");
      const runtime = await core.loadRuntime({
        canvas: canvasRef.current,
        onProgress(nextProgress) {
          if (generation !== generationRef.current) return;
          setProgress(nextProgress);
          setStatus(nextProgress.phase === "ready" ? "starting" : nextProgress.phase);
        },
      });
      if (generation !== generationRef.current) {
        runtime.stop();
        return;
      }
      runtimeRef.current = runtime;

      const source: GameRuntimeSource = {
        expectedSha256: backendSession.boot.artifactSha256,
        expectedSize: backendSession.boot.artifactSize,
        fileName: backendSession.boot.romFilename,
        url: backendSession.boot.romUrl,
      };
      await runtime.prepare(source);
      if (generation !== generationRef.current) return;
      setStatus("starting");
      await runtime.start();
      if (generation !== generationRef.current) return;
      runtime.setVolume(volume);
      runtime.setMuted(isMuted);
      setStatus("playing");
    } catch (launchError) {
      if (generation !== generationRef.current) return;
      runtimeRef.current?.stop();
      runtimeRef.current = null;
      releaseSession();
      setError(getLaunchError(launchError));
      setStatus("error");
    }
  }, [gameId, isMuted, releaseSession, volume]);

  const togglePause = useCallback(() => {
    if (status === "playing") {
      runtimeRef.current?.pause();
      setStatus("paused");
    } else if (status === "paused") {
      runtimeRef.current?.resume();
      setStatus("playing");
    }
  }, [status]);

  const reset = useCallback(() => runtimeRef.current?.reset(), []);
  const captureState = useCallback(() => {
    if (!runtimeRef.current) return Promise.reject(new Error("Start the game before saving a state."));
    return runtimeRef.current.captureState();
  }, []);
  const restoreState = useCallback((state: Blob) => {
    if (!runtimeRef.current) return Promise.reject(new Error("Start the game before loading a state."));
    return runtimeRef.current.restoreState(state);
  }, []);
  const captureBatterySave = useCallback(() => {
    if (!runtimeRef.current) return Promise.reject(new Error("Start the game before backing up battery RAM."));
    return runtimeRef.current.captureBatterySave();
  }, []);
  const pressInput = useCallback((button: string) => runtimeRef.current?.pressInput(button), []);
  const releaseInput = useCallback((button: string) => runtimeRef.current?.releaseInput(button), []);
  const setMuted = useCallback((muted: boolean) => {
    runtimeRef.current?.setMuted(muted);
    setIsMutedState(muted);
  }, []);
  const setVolume = useCallback((nextVolume: number) => {
    runtimeRef.current?.setVolume(nextVolume);
    setVolumeState(nextVolume);
  }, []);
  const inputBindings = useWasmInputBindings({
    active: status === "playing",
    onPress: pressInput,
    onRelease: releaseInput,
  });

  useEffect(() => () => {
    generationRef.current += 1;
    runtimeRef.current?.stop();
    runtimeRef.current = null;
    releaseSession();
  }, [gameId, releaseSession]);

  return {
    canvasRef,
    captureBatterySave,
    captureState,
    error,
    gamepadName: inputBindings.gamepadName,
    inputBindings,
    isMuted,
    progress,
    pressInput,
    reset,
    releaseInput,
    restoreState,
    setMuted,
    setVolume,
    start,
    status,
    stop,
    togglePause,
    volume,
  };
}

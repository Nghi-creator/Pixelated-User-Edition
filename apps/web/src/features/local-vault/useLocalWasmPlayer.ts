import { useCallback, useEffect, useRef, useState } from "react";
import { getWasmBrowserSupport } from "../../lib/runtime/wasm/browserSupport";
import {
  NostalgistWasmRuntime,
  type WasmRuntimeProgress,
} from "../../lib/runtime/wasm/NostalgistWasmRuntime";
import type { WasmPlayerStatus } from "../player/hooks/useWasmPlayer";

function getLocalLaunchError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "AbortError") return "Local launch was cancelled.";
    if (error.name === "NotAllowedError") {
      return "The browser blocked game audio. Allow audio for this site and press Retry.";
    }
    return error.message;
  }
  return "The browser emulator could not start this local ROM.";
}

export function useLocalWasmPlayer(file: File | null) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<NostalgistWasmRuntime | null>(null);
  const generationRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [gamepadName, setGamepadName] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [progress, setProgress] = useState<WasmRuntimeProgress | null>(null);
  const [status, setStatus] = useState<WasmPlayerStatus>("idle");
  const [volume, setVolumeState] = useState(1);

  const stopRuntime = useCallback(() => {
    generationRef.current += 1;
    runtimeRef.current?.stop();
    runtimeRef.current = null;
  }, []);

  const stop = useCallback(() => {
    stopRuntime();
    setProgress(null);
    setStatus("stopped");
  }, [stopRuntime]);

  const resetForFile = useCallback(() => {
    stopRuntime();
    setError(null);
    setProgress(null);
    setStatus("idle");
  }, [stopRuntime]);

  const start = useCallback(async () => {
    if (!file || !canvasRef.current) return;
    const support = getWasmBrowserSupport();
    if (!support.supported) {
      setError(support.reason);
      setStatus("error");
      return;
    }

    stopRuntime();
    const generation = generationRef.current;
    setError(null);
    setProgress(null);
    setStatus("preparing");
    const runtime = new NostalgistWasmRuntime({
      canvas: canvasRef.current,
      onProgress(nextProgress) {
        if (generation !== generationRef.current) return;
        setProgress(nextProgress);
        setStatus(nextProgress.phase === "ready" ? "starting" : nextProgress.phase);
      },
    });
    runtimeRef.current = runtime;

    try {
      await runtime.prepare({ file, fileName: file.name });
      if (generation !== generationRef.current) return;
      await runtime.start();
      if (generation !== generationRef.current) return;
      runtime.setVolume(volume);
      runtime.setMuted(isMuted);
      setStatus("playing");
    } catch (launchError) {
      if (generation !== generationRef.current) return;
      runtime.stop();
      runtimeRef.current = null;
      setError(getLocalLaunchError(launchError));
      setStatus("error");
    }
  }, [file, isMuted, stopRuntime, volume]);

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

  useEffect(() => {
    const refreshGamepads = () => {
      const gamepad = navigator.getGamepads?.().find(Boolean);
      setGamepadName(gamepad?.id || null);
    };
    refreshGamepads();
    window.addEventListener("gamepadconnected", refreshGamepads);
    window.addEventListener("gamepaddisconnected", refreshGamepads);
    return () => {
      window.removeEventListener("gamepadconnected", refreshGamepads);
      window.removeEventListener("gamepaddisconnected", refreshGamepads);
    };
  }, []);

  useEffect(() => () => stopRuntime(), [stopRuntime]);

  return {
    canvasRef,
    captureBatterySave,
    captureState,
    error,
    gamepadName,
    isMuted,
    progress,
    pressInput,
    reset,
    resetForFile,
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

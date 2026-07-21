import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_GAMEPAD_MAPPING,
  DEFAULT_KEYBOARD_MAPPING,
  INPUT_PREFERENCES_STORAGE_KEY,
  WASM_INPUT_ACTIONS,
  keyboardActionForCode,
  parseInputPreferences,
  rebindGamepad,
  rebindKeyboard,
  type GamepadInputMapping,
  type WasmInputAction,
  type WasmInputPreferences,
} from "./inputMappings";

type Options = {
  active: boolean;
  onPress: (action: WasmInputAction) => void;
  onRelease: (action: WasmInputAction) => void;
};

function connectedGamepad() {
  return navigator.getGamepads?.().find((gamepad): gamepad is Gamepad => Boolean(gamepad?.connected)) || null;
}

function shouldIgnoreKeyboardEvent(event: KeyboardEvent) {
  const target = event.target;
  if (!target || typeof target !== "object") return false;
  const element = target as HTMLElement;
  if (element.isContentEditable) return true;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) return true;
  if (element.tagName === "BUTTON" && ["Enter", "Space"].includes(event.code)) return true;
  return Boolean(element.closest?.("[data-ignore-game-input]"));
}

function loadPreferences() {
  try {
    return parseInputPreferences(localStorage.getItem(INPUT_PREFERENCES_STORAGE_KEY));
  } catch {
    return parseInputPreferences(null);
  }
}

function persistPreferences(preferences: WasmInputPreferences) {
  try {
    localStorage.setItem(INPUT_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Gameplay remains available with in-memory preferences when storage is blocked.
  }
}

export function useWasmInputBindings({ active, onPress, onRelease }: Options) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [gamepadName, setGamepadName] = useState(() => connectedGamepad()?.id || null);
  const keyboardPressedRef = useRef(new Map<string, WasmInputAction>());

  const gamepadMapping = useMemo<GamepadInputMapping>(() => {
    if (!gamepadName) return DEFAULT_GAMEPAD_MAPPING;
    return preferences.gamepads[gamepadName] || DEFAULT_GAMEPAD_MAPPING;
  }, [gamepadName, preferences.gamepads]);

  const commit = useCallback((next: WasmInputPreferences) => {
    persistPreferences(next);
    setPreferences(next);
  }, []);

  const setKeyboardBinding = useCallback((action: WasmInputAction, code: string) => {
    try {
      const keyboard = rebindKeyboard(preferences.keyboard, action, code);
      commit({ ...preferences, keyboard });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not assign that key.";
    }
  }, [commit, preferences]);

  const setGamepadBinding = useCallback((action: WasmInputAction, button: number) => {
    if (!gamepadName) return "Connect a gamepad before assigning buttons.";
    try {
      const mapping = rebindGamepad(gamepadMapping, action, button);
      commit({
        ...preferences,
        gamepads: { ...preferences.gamepads, [gamepadName]: mapping },
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Could not assign that button.";
    }
  }, [commit, gamepadMapping, gamepadName, preferences]);

  const resetKeyboardMapping = useCallback(() => {
    commit({ ...preferences, keyboard: { ...DEFAULT_KEYBOARD_MAPPING } });
  }, [commit, preferences]);

  const resetGamepadMapping = useCallback(() => {
    if (!gamepadName) return;
    const gamepads = { ...preferences.gamepads };
    delete gamepads[gamepadName];
    commit({ ...preferences, gamepads });
  }, [commit, gamepadName, preferences]);

  useEffect(() => {
    const refresh = (event: GamepadEvent) => {
      if (event.type === "gamepadconnected") setGamepadName(event.gamepad.id);
      if (event.type === "gamepaddisconnected") {
        setGamepadName(connectedGamepad()?.id || null);
      }
    };
    window.addEventListener("gamepadconnected", refresh);
    window.addEventListener("gamepaddisconnected", refresh);
    return () => {
      window.removeEventListener("gamepadconnected", refresh);
      window.removeEventListener("gamepaddisconnected", refresh);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const pressed = keyboardPressedRef.current;
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || shouldIgnoreKeyboardEvent(event)) return;
      const action = keyboardActionForCode(preferences.keyboard, event.code);
      if (!action) return;
      pressed.set(event.code, action);
      onPress(action);
      event.preventDefault();
    };
    const keyUp = (event: KeyboardEvent) => {
      const action = pressed.get(event.code);
      if (!action) return;
      pressed.delete(event.code);
      onRelease(action);
      event.preventDefault();
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      pressed.forEach((action) => onRelease(action));
      pressed.clear();
    };
  }, [active, onPress, onRelease, preferences.keyboard]);

  useEffect(() => {
    if (!active || !gamepadName) return;
    const pressed = new Set<WasmInputAction>();
    let frame = 0;
    const poll = () => {
      const gamepad = connectedGamepad();
      const next = new Set<WasmInputAction>();
      if (gamepad?.id === gamepadName) {
        WASM_INPUT_ACTIONS.forEach((action) => {
          const button = gamepad.buttons[gamepadMapping[action]];
          if (button?.pressed || (button?.value || 0) > 0.5) next.add(action);
        });
      }
      next.forEach((action) => {
        if (!pressed.has(action)) onPress(action);
      });
      pressed.forEach((action) => {
        if (!next.has(action)) onRelease(action);
      });
      pressed.clear();
      next.forEach((action) => pressed.add(action));
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      pressed.forEach((action) => onRelease(action));
    };
  }, [active, gamepadMapping, gamepadName, onPress, onRelease]);

  return {
    gamepadMapping,
    gamepadName,
    keyboardMapping: preferences.keyboard,
    resetGamepadMapping,
    resetKeyboardMapping,
    setGamepadBinding,
    setKeyboardBinding,
  };
}

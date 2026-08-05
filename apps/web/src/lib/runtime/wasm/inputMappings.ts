export const WASM_INPUT_ACTIONS = [
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "start",
  "select",
] as const;

export type WasmInputAction = (typeof WASM_INPUT_ACTIONS)[number];
export type KeyboardInputMapping = Record<WasmInputAction, string>;
export type GamepadInputMapping = Record<WasmInputAction, number>;

export type WasmInputPreferences = {
  gamepads: Record<string, GamepadInputMapping>;
  keyboard: KeyboardInputMapping;
  version: 1;
};

export const INPUT_ACTION_LABELS: Record<WasmInputAction, string> = {
  a: "A",
  b: "B",
  down: "Down",
  left: "Left",
  right: "Right",
  select: "Select",
  start: "Start",
  up: "Up",
};

export const DEFAULT_KEYBOARD_MAPPING: KeyboardInputMapping = {
  a: "KeyX",
  b: "KeyZ",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  select: "ShiftLeft",
  start: "Enter",
  up: "ArrowUp",
};

export const DEFAULT_GAMEPAD_MAPPING: GamepadInputMapping = {
  a: 1,
  b: 0,
  down: 13,
  left: 14,
  right: 15,
  select: 8,
  start: 9,
  up: 12,
};

export const INPUT_PREFERENCES_STORAGE_KEY = "pixelated:wasm-input:v1";

export function createDefaultInputPreferences(): WasmInputPreferences {
  return {
    gamepads: {},
    keyboard: { ...DEFAULT_KEYBOARD_MAPPING },
    version: 1,
  };
}

function hasEveryAction(mapping: Record<string, unknown>) {
  return WASM_INPUT_ACTIONS.every((action) => action in mapping);
}

export function isValidKeyboardMapping(value: unknown): value is KeyboardInputMapping {
  if (!value || typeof value !== "object" || !hasEveryAction(value as Record<string, unknown>)) return false;
  const bindings = WASM_INPUT_ACTIONS.map((action) => (value as Record<string, unknown>)[action]);
  return bindings.every((binding) => typeof binding === "string" && binding.length > 0) && new Set(bindings).size === bindings.length;
}

export function isValidGamepadMapping(value: unknown): value is GamepadInputMapping {
  if (!value || typeof value !== "object" || !hasEveryAction(value as Record<string, unknown>)) return false;
  const bindings = WASM_INPUT_ACTIONS.map((action) => (value as Record<string, unknown>)[action]);
  return bindings.every((binding) => Number.isInteger(binding) && Number(binding) >= 0) && new Set(bindings).size === bindings.length;
}

export function parseInputPreferences(value: string | null): WasmInputPreferences {
  if (!value) return createDefaultInputPreferences();
  try {
    const parsed = JSON.parse(value) as Partial<WasmInputPreferences>;
    if (parsed.version !== 1 || !isValidKeyboardMapping(parsed.keyboard)) {
      return createDefaultInputPreferences();
    }
    const gamepads = Object.fromEntries(
      Object.entries(parsed.gamepads || {}).filter(([, mapping]) => isValidGamepadMapping(mapping)),
    );
    return { gamepads, keyboard: parsed.keyboard, version: 1 };
  } catch {
    return createDefaultInputPreferences();
  }
}

function assertAvailableBinding<T extends string | number>(
  mapping: Record<WasmInputAction, T>,
  action: WasmInputAction,
  binding: T,
) {
  const conflict = WASM_INPUT_ACTIONS.find(
    (candidate) => candidate !== action && mapping[candidate] === binding,
  );
  if (conflict) {
    throw new Error(`${String(binding)} is already assigned to ${INPUT_ACTION_LABELS[conflict]}.`);
  }
}

export function rebindKeyboard(
  mapping: KeyboardInputMapping,
  action: WasmInputAction,
  code: string,
) {
  if (!code.trim()) throw new Error("Choose a keyboard key.");
  assertAvailableBinding(mapping, action, code);
  return { ...mapping, [action]: code };
}

export function rebindGamepad(
  mapping: GamepadInputMapping,
  action: WasmInputAction,
  button: number,
) {
  if (!Number.isInteger(button) || button < 0) throw new Error("Choose a valid gamepad button.");
  assertAvailableBinding(mapping, action, button);
  return { ...mapping, [action]: button };
}

export function keyboardActionForCode(mapping: KeyboardInputMapping, code: string) {
  return WASM_INPUT_ACTIONS.find((action) => mapping[action] === code) || null;
}

export function formatKeyboardCode(code: string) {
  const labels: Record<string, string> = {
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    ArrowUp: "↑",
    Enter: "Enter",
    ShiftLeft: "Left Shift",
    ShiftRight: "Right Shift",
    Space: "Space",
  };
  return labels[code] || code.replace(/^Key/, "").replace(/^Digit/, "");
}

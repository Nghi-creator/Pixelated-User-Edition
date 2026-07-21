import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_GAMEPAD_MAPPING,
  DEFAULT_KEYBOARD_MAPPING,
  createDefaultInputPreferences,
  formatKeyboardCode,
  isValidGamepadMapping,
  isValidKeyboardMapping,
  keyboardActionForCode,
  parseInputPreferences,
  rebindGamepad,
  rebindKeyboard,
} from "../../../src/features/player/input/inputMappings.ts";

test("default keyboard and standard-gamepad mappings are complete and conflict-free", () => {
  assert.equal(isValidKeyboardMapping(DEFAULT_KEYBOARD_MAPPING), true);
  assert.equal(isValidGamepadMapping(DEFAULT_GAMEPAD_MAPPING), true);
  assert.equal(keyboardActionForCode(DEFAULT_KEYBOARD_MAPPING, "KeyX"), "a");
  assert.equal(keyboardActionForCode(DEFAULT_KEYBOARD_MAPPING, "KeyZ"), "b");
  assert.equal(keyboardActionForCode(DEFAULT_KEYBOARD_MAPPING, "KeyQ"), null);
});

test("input preferences preserve valid per-controller mappings", () => {
  const preferences = createDefaultInputPreferences();
  preferences.gamepads["Example Controller"] = rebindGamepad(
    DEFAULT_GAMEPAD_MAPPING,
    "a",
    7,
  );
  const parsed = parseInputPreferences(JSON.stringify(preferences));
  assert.equal(parsed.gamepads["Example Controller"]?.a, 7);
  assert.equal(parsed.keyboard.start, "Enter");
});

test("invalid stored mappings fall back safely", () => {
  assert.deepEqual(parseInputPreferences("not json"), createDefaultInputPreferences());
  assert.deepEqual(
    parseInputPreferences(JSON.stringify({ keyboard: { up: "KeyW" }, version: 1 })),
    createDefaultInputPreferences(),
  );
});

test("keyboard and gamepad rebinding rejects conflicts", () => {
  assert.throws(
    () => rebindKeyboard(DEFAULT_KEYBOARD_MAPPING, "a", "KeyZ"),
    /already assigned to B/,
  );
  assert.throws(
    () => rebindGamepad(DEFAULT_GAMEPAD_MAPPING, "start", 8),
    /already assigned to Select/,
  );
  assert.equal(rebindKeyboard(DEFAULT_KEYBOARD_MAPPING, "a", "KeyQ").a, "KeyQ");
  assert.equal(rebindGamepad(DEFAULT_GAMEPAD_MAPPING, "a", 7).a, 7);
});

test("keyboard codes have readable labels", () => {
  assert.equal(formatKeyboardCode("ArrowUp"), "↑");
  assert.equal(formatKeyboardCode("ShiftLeft"), "Left Shift");
  assert.equal(formatKeyboardCode("KeyQ"), "Q");
  assert.equal(formatKeyboardCode("Digit4"), "4");
});

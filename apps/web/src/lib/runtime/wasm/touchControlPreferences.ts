export type TouchControlPreset = "compact" | "large" | "contrast";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

export type TouchControlPreferences = {
  preset: TouchControlPreset;
  swapButtons: boolean;
};

function isTouchControlPreset(value: string | null): value is TouchControlPreset {
  return value === "compact" || value === "large" || value === "contrast";
}

export function readTouchControlPreferences(
  preferenceKey: string,
  storage?: PreferenceStorage,
): TouchControlPreferences {
  try {
    const target = storage || globalThis.localStorage;
    const storedPreset = target.getItem(`${preferenceKey}:preset`);
    return {
      preset: isTouchControlPreset(storedPreset) ? storedPreset : "large",
      swapButtons: target.getItem(`${preferenceKey}:swap`) === "true",
    };
  } catch {
    return { preset: "large", swapButtons: false };
  }
}

export function writeTouchControlPreference(
  preferenceKey: string,
  name: "preset" | "swap",
  value: string,
  storage?: PreferenceStorage,
) {
  try {
    const target = storage || globalThis.localStorage;
    target.setItem(`${preferenceKey}:${name}`, value);
    return true;
  } catch {
    return false;
  }
}

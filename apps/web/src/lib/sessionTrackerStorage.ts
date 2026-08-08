type SessionStorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function getBrowserSessionStorage(): SessionStorageLike | null {
  try {
    return globalThis.sessionStorage;
  } catch {
    return null;
  }
}

export function createSessionTrackerStorage(storage = getBrowserSessionStorage()) {
  const fallbackValues = new Map<string, string>();

  return {
    getItem(key: string) {
      try {
        return storage?.getItem(key) ?? fallbackValues.get(key) ?? null;
      } catch {
        return fallbackValues.get(key) ?? null;
      }
    },
    removeItem(key: string) {
      fallbackValues.delete(key);
      try {
        storage?.removeItem(key);
      } catch {
        // The in-memory fallback still preserves safe retry behavior.
      }
    },
    setItem(key: string, value: string) {
      fallbackValues.set(key, value);
      try {
        storage?.setItem(key, value);
      } catch {
        // Telemetry bookkeeping remains available in memory when storage is blocked.
      }
    },
  };
}

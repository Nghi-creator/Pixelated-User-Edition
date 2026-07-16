const DATABASE_NAME = "pixelated-wasm-saves";
const DATABASE_VERSION = 1;
const STORE_NAME = "states";
export const MAX_IMPORTED_STATE_BYTES = 16 * 1024 * 1024;

export type WasmSaveSlot = 1 | 2 | 3;

export type WasmSaveRecord = {
  core: "fceumm";
  createdAt: string;
  gameKey: string;
  id: string;
  slot: WasmSaveSlot;
  state: Blob;
  thumbnail?: Blob;
  version: 1;
};

export function createWasmSaveRecord(
  gameKey: string,
  slot: WasmSaveSlot,
  state: Blob,
  thumbnail?: Blob,
  now = new Date(),
): WasmSaveRecord {
  return {
    core: "fceumm",
    createdAt: now.toISOString(),
    gameKey,
    id: `${gameKey}:${slot}`,
    slot,
    state,
    thumbnail,
    version: 1,
  };
}

export function validateImportedState(file: Pick<File, "name" | "size">) {
  if (file.size <= 0) throw new Error("The selected save-state file is empty.");
  if (file.size > MAX_IMPORTED_STATE_BYTES) {
    throw new Error("The selected save state exceeds the 16 MB safety limit.");
  }
  if (!/\.(state|savestate)$/i.test(file.name)) {
    throw new Error("Choose a .state or .savestate file exported by Pixelated.");
  }
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function openSaveDatabase() {
  if (!globalThis.indexedDB) return Promise.resolve<IDBDatabase | null>(null);
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        const store = request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("gameKey", "gameKey");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open browser save storage."));
  });
}

export async function listWasmSaveRecords(gameKey: string) {
  const database = await openSaveDatabase();
  if (!database) return [];
  try {
    const records = await requestResult(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("gameKey").getAll(gameKey),
    ) as WasmSaveRecord[];
    return records.sort((left, right) => left.slot - right.slot);
  } finally {
    database.close();
  }
}

export async function putWasmSaveRecord(record: WasmSaveRecord) {
  const database = await openSaveDatabase();
  if (!database) throw new Error("This browser does not provide IndexedDB save storage.");
  try {
    await requestResult(database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(record));
  } finally {
    database.close();
  }
}

export async function deleteWasmSaveRecord(gameKey: string, slot: WasmSaveSlot) {
  const database = await openSaveDatabase();
  if (!database) return;
  try {
    await requestResult(database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(`${gameKey}:${slot}`));
  } finally {
    database.close();
  }
}

export async function getSaveStorageEstimate() {
  if (!navigator.storage?.estimate) return null;
  const { quota = 0, usage = 0 } = await navigator.storage.estimate();
  return { quota, usage };
}

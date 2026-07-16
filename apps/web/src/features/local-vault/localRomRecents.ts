import { getLocalGameTitle, type LocalRomSystemId } from "./localVaultState.ts";

const DATABASE_NAME = "pixelated-user-edition";
const DATABASE_VERSION = 1;
const STORE_NAME = "local-rom-recents";

export type LocalRomRecent = {
  fileName: string;
  id: string;
  lastOpenedAt: string;
  size: number;
  systemId: LocalRomSystemId;
  systemLabel: string;
  title: string;
};

export function createLocalRomRecent(
  file: Pick<File, "lastModified" | "name" | "size">,
  system: { id: LocalRomSystemId; label: string },
  now = new Date(),
): LocalRomRecent {
  return {
    fileName: file.name,
    id: `${file.name}:${file.size}:${file.lastModified}`,
    lastOpenedAt: now.toISOString(),
    size: file.size,
    systemId: system.id,
    systemLabel: system.label,
    title: getLocalGameTitle(file.name),
  };
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function openRecentsDatabase() {
  if (!globalThis.indexedDB) return Promise.resolve<IDBDatabase | null>(null);
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local ROM history."));
  });
}

export async function listLocalRomRecents() {
  const database = await openRecentsDatabase();
  if (!database) return [];
  try {
    const rows = await requestResult(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll(),
    ) as LocalRomRecent[];
    return rows
      .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
      .slice(0, 12);
  } finally {
    database.close();
  }
}

export async function saveLocalRomRecent(recent: LocalRomRecent) {
  const database = await openRecentsDatabase();
  if (!database) return;
  try {
    await requestResult(
      database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(recent),
    );
  } finally {
    database.close();
  }
}

export async function removeLocalRomRecent(id: string) {
  const database = await openRecentsDatabase();
  if (!database) return;
  try {
    await requestResult(
      database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id),
    );
  } finally {
    database.close();
  }
}

export async function clearLocalRomRecents() {
  const database = await openRecentsDatabase();
  if (!database) return;
  try {
    await requestResult(
      database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear(),
    );
  } finally {
    database.close();
  }
}

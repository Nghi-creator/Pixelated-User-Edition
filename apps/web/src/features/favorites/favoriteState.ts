export type FavoriteSnapshot = {
  error: string;
  ids: ReadonlySet<string>;
  pendingIds: ReadonlySet<string>;
};

const EMPTY_IDS = new Set<string>();
const listeners = new Set<() => void>();
let snapshot: FavoriteSnapshot = {
  error: "",
  ids: EMPTY_IDS,
  pendingIds: EMPTY_IDS,
};

function emit(nextSnapshot: FavoriteSnapshot) {
  snapshot = nextSnapshot;
  for (const listener of listeners) listener();
}

export function getFavoriteSnapshot() {
  return snapshot;
}

export function subscribeToFavorites(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetFavoriteState() {
  emit({
    error: "",
    ids: new Set(),
    pendingIds: new Set(),
  });
}

export function replaceFavoriteIds(ids: ReadonlySet<string>) {
  emit({
    ...snapshot,
    error: "",
    ids: new Set(ids),
  });
}

export async function mutateFavorite(
  gameId: string,
  favorited: boolean,
  mutate: () => Promise<unknown>,
) {
  if (snapshot.pendingIds.has(gameId)) return false;

  const pendingIds = new Set(snapshot.pendingIds);
  pendingIds.add(gameId);
  emit({ ...snapshot, error: "", pendingIds });

  try {
    await mutate();
    const ids = new Set(snapshot.ids);
    if (favorited) ids.add(gameId);
    else ids.delete(gameId);
    emit({ ...snapshot, error: "", ids });
    return true;
  } catch (error) {
    emit({
      ...snapshot,
      error:
        error instanceof Error
          ? error.message
          : "Could not update favorite. Try again.",
    });
    throw error;
  } finally {
    const nextPendingIds = new Set(snapshot.pendingIds);
    nextPendingIds.delete(gameId);
    emit({ ...snapshot, pendingIds: nextPendingIds });
  }
}

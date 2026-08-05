export type AuthScopedCacheState = {
  favorites: unknown | null;
  permissions: unknown | null;
  session: unknown | null;
};

export const clearAuthScopedCache = (state: AuthScopedCacheState) => {
  state.favorites = null;
  state.permissions = null;
  state.session = null;
};

export const setAuthScopedSession = (
  state: Pick<AuthScopedCacheState, "session">,
  session: unknown,
) => {
  state.session = Promise.resolve(session);
};

import { supabase } from "../auth/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { createRequestAbortController, withTimeout } from "./requestLifecycle";
import {
  clearCacheEntryOnRejection,
  clearAuthScopedCache,
  setAuthScopedSession,
} from "../auth/authCache";
import type { ApiPermissionsResponse } from "./apiTypes";
import { createCatalogApi } from "./catalogApi";
import { createProfileApi } from "./profileApi";
import { createSessionApi } from "./sessionApi";
import { createSocialApi } from "./socialApi";
import { createTelemetryApi } from "./telemetryApi";
import type { ApiRequest, ApiRequestOptions, ApiResponseParser } from "./apiRequestTypes.ts";
import { apiPermissionsSchema, favoriteIdsSchema } from "./apiResponseSchemas.ts";
import { readBoundedResponseText } from "./boundedResponse.ts";

export type * from "./apiTypes";

const LOCAL_API_URL = "http://127.0.0.1:4000";
const PRODUCTION_API_URL = "https://pixelated-api-services-6ovi.onrender.com";
const DEFAULT_API_TIMEOUT_MS = 30_000;
const CLIENT_CACHE_TTL_MS = 30_000;

const isLocalBrowserHost = () => {
  if (typeof window === "undefined") return true;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
};

const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return isLocalBrowserHost() ? LOCAL_API_URL : PRODUCTION_API_URL;
};

export const API_URL = getDefaultApiUrl().replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const authScopedCache = {
  session: null as Promise<Session | null> | null,
  permissions: null as {
    expiresAt: number;
    promise: Promise<ApiPermissionsResponse>;
    value?: ApiPermissionsResponse;
  } | null,
  favorites: null as {
    expiresAt: number;
    promise: Promise<Set<string>>;
    value?: Set<string>;
  } | null,
};

export function clearApiAuthScopedCache() {
  clearAuthScopedCache(authScopedCache);
}

export function setApiAuthSession(session: Session | null) {
  setAuthScopedSession(authScopedCache, session);
}

export async function getAuthSession() {
  if (!authScopedCache.session) {
    authScopedCache.session = supabase.auth
      .getSession()
      .then(({ data: { session } }) => session ?? null)
      .catch((error) => {
        authScopedCache.session = null;
        throw error;
      });
  }

  return authScopedCache.session;
}

function isCacheFresh(cache: { expiresAt: number } | null) {
  return Boolean(cache && cache.expiresAt > Date.now());
}

export function clearFavoritesCache() {
  authScopedCache.favorites = null;
}

export function clearPermissionsCache() {
  authScopedCache.permissions = null;
}

export const apiRequest: ApiRequest = async <T>(
  path: string,
  {
    authenticated = true,
    headers,
    timeoutMs = DEFAULT_API_TIMEOUT_MS,
    ...options
  }: ApiRequestOptions = {},
  parser: ApiResponseParser<T>,
) => {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  if (options.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const session = await withTimeout(
      getAuthSession(),
      timeoutMs,
      () =>
        new ApiError(0, {
          error: "Authentication did not respond in time. Refresh the page and try again.",
        }),
    );

    if (session?.access_token) {
      requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  const { controller, cleanup } = createRequestAbortController(timeoutMs, options.signal);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: requestHeaders,
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError(response.status, {
        error: "The API returned an unsupported response format.",
      });
    }

    let responseText: string;
    try {
      responseText = await readBoundedResponseText(response);
    } catch (error) {
      throw new ApiError(response.status, {
        error:
          error instanceof Error ? error.message : "The API response could not be read safely.",
      });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(responseText);
    } catch {
      throw new ApiError(response.status, {
        error: "The API returned malformed JSON.",
      });
    }

    if (payload === null || typeof payload !== "object") {
      throw new ApiError(response.status, {
        error: "The API returned an invalid payload shape.",
      });
    }

    if (!response.ok) {
      throw new ApiError(response.status, payload);
    }

    try {
      return parser.parse(payload);
    } catch {
      throw new ApiError(response.status, {
        error: "The API returned data that did not match the expected response shape.",
      });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(0, {
        error: "The API did not respond in time. The backend may be waking up; try again shortly.",
      });
    }
    throw error;
  } finally {
    cleanup();
  }
};

export async function getCachedPermissions(): Promise<ApiPermissionsResponse> {
  if (isCacheFresh(authScopedCache.permissions) && authScopedCache.permissions) {
    if (authScopedCache.permissions.value) return authScopedCache.permissions.value;
    return authScopedCache.permissions.promise;
  }

  const request = apiRequest("/me/permissions", undefined, apiPermissionsSchema).then((value) => {
    if (authScopedCache.permissions) authScopedCache.permissions.value = value;
    return value;
  });
  const promise = clearCacheEntryOnRejection(request, (rejectedPromise) => {
    if (authScopedCache.permissions?.promise === rejectedPromise) {
      authScopedCache.permissions = null;
    }
  });
  authScopedCache.permissions = {
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    promise,
  };
  return promise;
}

async function getFavoriteIds(): Promise<Set<string>> {
  if (isCacheFresh(authScopedCache.favorites) && authScopedCache.favorites) {
    if (authScopedCache.favorites.value) return authScopedCache.favorites.value;
    return authScopedCache.favorites.promise;
  }

  const request = apiRequest("/favorites", undefined, favoriteIdsSchema).then(({ favorites }) => {
    const favoriteIds = new Set(
      favorites
        .map((favorite) => favorite.id || favorite.game_id)
        .filter((id): id is string => Boolean(id)),
    );
    if (authScopedCache.favorites) authScopedCache.favorites.value = favoriteIds;
    return favoriteIds;
  });
  const promise = clearCacheEntryOnRejection(request, (rejectedPromise) => {
    if (authScopedCache.favorites?.promise === rejectedPromise) {
      authScopedCache.favorites = null;
    }
  });

  authScopedCache.favorites = {
    expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    promise,
  };
  return promise;
}

export const api = {
  ...createCatalogApi({
    apiRequest,
    clearFavoritesCache,
    getFavoriteIds,
  }),
  ...createProfileApi({
    apiRequest,
    clearPermissionsCache,
    getCachedPermissions,
  }),
  ...createSessionApi({ apiRequest }),
  ...createSocialApi({ apiRequest }),
  ...createTelemetryApi({ apiRequest }),
};

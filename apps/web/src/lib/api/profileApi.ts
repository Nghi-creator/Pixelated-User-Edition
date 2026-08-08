import type { ApiPermissionsResponse } from "./apiTypes";
import type { ApiRequest } from "./apiRequestTypes.ts";
import {
  apiMeSchema,
  apiProfileActivitySchema,
  apiProfileResponseSchema,
  successSchema,
  voidSchema,
} from "./apiResponseSchemas.ts";

type ProfileApiDependencies = {
  apiRequest: ApiRequest;
  clearPermissionsCache: () => void;
  getCachedPermissions: () => Promise<ApiPermissionsResponse>;
};

export function createProfileApi({
  apiRequest,
  clearPermissionsCache,
  getCachedPermissions,
}: ProfileApiDependencies) {
  return {
    deleteAccount: () =>
      apiRequest(
        "/me/account",
        { body: JSON.stringify({ confirmation: "DELETE" }), method: "DELETE" },
        voidSchema,
      ),
    me: () => apiRequest("/me", undefined, apiMeSchema),
    permissions: () => getCachedPermissions(),
    profile: () => apiRequest("/profile", undefined, apiProfileResponseSchema),
    profileActivity: (limit = 8) =>
      apiRequest(`/profile/activity?limit=${limit}`, undefined, apiProfileActivitySchema),
    updateProfile: async (payload: { avatarUrl: string | null; username: string }) => {
      const result = await apiRequest(
        "/profile",
        { body: JSON.stringify(payload), method: "PATCH" },
        successSchema,
      );
      clearPermissionsCache();
      return result;
    },
  };
}

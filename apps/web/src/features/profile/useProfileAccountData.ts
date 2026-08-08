import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAuthSessionQuery,
  useProfileActivityQuery,
  useProfileQuery,
} from "../../hooks/queryHooks";

export function useProfileAccountData() {
  const navigate = useNavigate();
  const sessionQuery = useAuthSessionQuery();
  const user = sessionQuery.data?.user || null;
  const profileQuery = useProfileQuery({ enabled: Boolean(user) });
  const activityQuery = useProfileActivityQuery({
    enabled: Boolean(user),
    userId: user?.id,
  });

  useEffect(() => {
    if (!sessionQuery.isLoading && !user) navigate("/login");
  }, [navigate, sessionQuery.isLoading, user]);

  const loadError =
    sessionQuery.isError || profileQuery.isError
      ? sessionQuery.error instanceof Error
        ? sessionQuery.error.message
        : profileQuery.error instanceof Error
          ? profileQuery.error.message
          : "Failed to load account settings."
      : null;

  const profile = profileQuery.data?.profile || null;

  return {
    activity: activityQuery.data?.activity || [],
    activityError: activityQuery.isError,
    activityLoading: activityQuery.isLoading,
    hasPassword: user?.app_metadata?.providers?.includes("email"),
    loadError,
    loading: sessionQuery.isLoading || !user || profileQuery.isLoading,
    navigate,
    profile,
    retryActivity: activityQuery.refetch,
    retryLoad: () => {
      void sessionQuery.refetch();
      void profileQuery.refetch();
    },
    user,
    userRole: profile?.role || "user",
  };
}

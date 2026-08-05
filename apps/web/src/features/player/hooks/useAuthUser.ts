import { useAuthSessionQuery } from "../../../hooks/api/queryHooks";

export function useAuthUser() {
  return useAuthSessionQuery().data?.user ?? null;
}

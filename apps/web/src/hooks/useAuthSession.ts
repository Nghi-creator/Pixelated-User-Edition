import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type AuthSessionContextValue = {
  loading: boolean;
  session: Session | null;
};

export const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession must be used within AuthSessionProvider.");
  }
  return value;
}

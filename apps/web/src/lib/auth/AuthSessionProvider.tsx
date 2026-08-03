import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { resetFavoriteState } from "../../features/favorites/favoriteState";
import { clearApiAuthScopedCache } from "../api/apiClient";
import { queryClient } from "../api/queryClient";
import { createAuthIdentityTracker } from "./authIdentityTracker";
import { AuthSessionContext } from "./authSessionContext";
import { supabase } from "./supabaseClient";

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    const trackIdentity = createAuthIdentityTracker(() => {
      clearApiAuthScopedCache();
      resetFavoriteState();
      // Private queries must never survive an account change in the same SPA.
      queryClient.clear();
    });
    const updateSession = (nextSession: Session | null) => {
      if (!active) return;
      trackIdentity(nextSession?.user.id || null);
      setSession(nextSession);
      setLoading(false);
    };

    void supabase.auth.getSession().then(
      ({ data }) => updateSession(data.session),
      () => updateSession(null),
    );
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      updateSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ loading, session }), [loading, session]);
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

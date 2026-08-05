import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { resetFavoriteState } from "../../lib/favoriteState";
import {
  clearApiAuthScopedCache,
  setApiAuthSession,
} from "../../lib/api/apiClient";
import { queryClient } from "../../lib/api/queryClient";
import { createAuthIdentityTracker } from "../../lib/auth/authIdentityTracker";
import { AuthSessionContext } from "../../hooks/useAuthSession";
import { supabase } from "../../lib/auth/supabaseClient";

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
      // TOKEN_REFRESHED keeps the same identity but replaces the access token.
      // Keep API authentication current without discarding same-user query data.
      setApiAuthSession(nextSession);
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

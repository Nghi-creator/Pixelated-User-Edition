import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/auth/supabaseClient";
import { getAuthSession } from "../../lib/api/apiClient";
import { usePermissionsQuery } from "../../lib/api/apiQueries";

export function useNavbarAccount() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const isKickingOut = useRef(false);
  useEffect(() => {
    void getAuthSession().then((session) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);
  const permissions = usePermissionsQuery({ enabled: Boolean(user) });
  useEffect(() => {
    if (!user || !permissions.data?.profile.is_banned || isKickingOut.current) return;
    isKickingOut.current = true;
    void supabase.auth.signOut().then(() => {
      setUser(null); alert("Your account has been permanently suspended.");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    });
  }, [permissions.data, user]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut(); navigate("/");
  }, [navigate]);
  return { profile: permissions.data?.profile, signOut, user };
}

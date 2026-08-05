import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/auth/supabaseClient";
import { usePermissionsQuery } from "../../hooks/queryHooks";
import { useAuthSession } from "../../hooks/useAuthSession";

export function useNavbarAccount() {
  const { session } = useAuthSession();
  const user = session?.user || null;
  const navigate = useNavigate();
  const isKickingOut = useRef(false);
  const permissions = usePermissionsQuery({ enabled: Boolean(user) });
  useEffect(() => {
    if (!user || !permissions.data?.profile.is_banned || isKickingOut.current) return;
    isKickingOut.current = true;
    void supabase.auth.signOut().then(() => {
      alert("Your account has been permanently suspended.");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    });
  }, [permissions.data, user]);
  const signOut = useCallback(async () => {
    await supabase.auth.signOut(); navigate("/");
  }, [navigate]);
  return { profile: permissions.data?.profile, signOut, user };
}

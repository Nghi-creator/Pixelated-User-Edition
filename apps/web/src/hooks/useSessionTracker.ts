import { useEffect } from "react";
import { api } from "../lib/api/apiClient";
import { createSessionTrackerStorage } from "../lib/sessionTrackerStorage";
import { useAuthSession } from "./useAuthSession";

const SESSION_ID_KEY = "pixelated_access_session_id";
const LOGGED_STATE_PREFIX = "pixelated_logged_user_";
const trackerStorage = createSessionTrackerStorage();

function getAccessSessionId() {
  const existingSessionId = trackerStorage.getItem(SESSION_ID_KEY);
  if (existingSessionId) return existingSessionId;

  const nextSessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  trackerStorage.setItem(SESSION_ID_KEY, nextSessionId);
  return nextSessionId;
}

export function useSessionTracker() {
  const { loading, session } = useAuthSession();
  const userId = session?.user.id || null;

  useEffect(() => {
    if (loading) return;
    const accessSessionId = getAccessSessionId();

    const logSession = async (user_id: string | null = null) => {
      const sessionKey = LOGGED_STATE_PREFIX + (user_id || "guest");

      if (trackerStorage.getItem(sessionKey) === "true") {
        return;
      }

      trackerStorage.setItem(sessionKey, "true");

      try {
        await api.logAccess(window.location.pathname, accessSessionId);
      } catch (err) {
        console.error("Exception in logSession", err);
        trackerStorage.removeItem(sessionKey);
      }
    };

    void logSession(userId);
  }, [loading, userId]);
}

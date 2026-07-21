import { useMemo } from "react";
import type { Location } from "react-router-dom";

type PlayerBackState = {
  backRoute?: unknown;
  backText?: unknown;
};

const isPlayerBackState = (state: unknown): state is PlayerBackState =>
  typeof state === "object" && state !== null;

export function usePlayerNavigation(location: Location, gameId?: string) {
  void gameId;
  const fallbackBackRoute = "/home";
  const fallbackBackText = "Back to Cloud Library";
  const backState = isPlayerBackState(location.state) ? location.state : null;

  return {
    backRoute:
      typeof backState?.backRoute === "string"
        ? backState.backRoute
        : fallbackBackRoute,
    backText:
      typeof backState?.backText === "string"
        ? backState.backText
        : fallbackBackText,
    lobbySearch: useMemo(
      () => new URLSearchParams(location.search),
      [location.search],
    ),
  };
}

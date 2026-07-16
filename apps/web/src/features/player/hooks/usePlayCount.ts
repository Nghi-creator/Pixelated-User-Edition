import { useEffect } from "react";
import { useCountPlayMutation } from "./playerMutations";

export function usePlayCount(gameId: string | undefined, isPlaying = true) {
  const { mutate } = useCountPlayMutation({
    onError: (err) => {
      console.error("Failed to count play:", err);
    },
    onSuccess: () => {
      console.log("Play successfully counted!");
    },
  });

  useEffect(() => {
    if (!gameId || !isPlaying) return;

    const timer = setTimeout(() => mutate(gameId), 30000);

    return () => clearTimeout(timer);
  }, [gameId, isPlaying, mutate]);
}

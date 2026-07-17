import { useEffect, useRef } from "react";
import { useCountPlayMutation } from "./playerMutations";

export function usePlayCount(gameId: string | undefined, isPlaying = true) {
  const eventRef = useRef<{ gameId: string; playEventId: string } | null>(null);
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

    if (eventRef.current?.gameId !== gameId) {
      eventRef.current = {
        gameId,
        playEventId: `play_${crypto.randomUUID().replaceAll("-", "")}`,
      };
    }
    const event = eventRef.current;
    const timer = setTimeout(() => mutate(event), 30000);

    return () => clearTimeout(timer);
  }, [gameId, isPlaying, mutate]);
}

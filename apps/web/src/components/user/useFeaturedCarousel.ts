import { useEffect, useState } from "react";

export function useFeaturedCarousel(itemCount: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [pageVisible, setPageVisible] = useState(() => !document.hidden);
  const safeCurrentIndex = Math.min(currentIndex, Math.max(0, itemCount - 1));
  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  useEffect(() => {
    if (itemCount <= 1 || isPaused || !pageVisible) return;
    const interval = window.setInterval(
      () => setCurrentIndex((index) => (index + 1) % itemCount),
      5000,
    );
    return () => window.clearInterval(interval);
  }, [isPaused, itemCount, pageVisible]);
  return {
    currentIndex: safeCurrentIndex,
    isPaused,
    next: () => setCurrentIndex((index) => (index + 1) % itemCount),
    previous: () => setCurrentIndex((index) => (index === 0 ? itemCount - 1 : index - 1)),
    select: setCurrentIndex,
    togglePaused: () => setIsPaused((paused) => !paused),
  };
}

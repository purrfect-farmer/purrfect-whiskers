import { useCallback, useEffect, useState } from "react";

/** Toggles fullscreen on the element in `ref` and tracks its state */
export default function useElementFullscreen(ref) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const element = ref.current;

    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else if (document.fullscreenElement === element) {
      document.exitFullscreen();
    }
  }, [ref]);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === ref.current);

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [ref]);

  return { isFullscreen, toggleFullscreen };
}

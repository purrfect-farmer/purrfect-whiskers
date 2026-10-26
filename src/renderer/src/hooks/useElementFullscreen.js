import { useCallback, useEffect, useState } from "react";

/** A hook for toggling fullscreen on the element in `ref` */
export default function useElementFullscreen(ref) {
  /** Whether the element is fullscreen */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /** The toggle of fullscreen */
  const toggleFullscreen = useCallback(() => {
    const element = ref.current;

    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else if (document.fullscreenElement === element) {
      document.exitFullscreen();
    }
  }, [ref]);

  /** The tracking of fullscreen changes */
  useEffect(() => {
    /** The handler of fullscreen changes */
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === ref.current);

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [ref]);

  return { isFullscreen, toggleFullscreen };
}

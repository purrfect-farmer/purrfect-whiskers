import { useEffect, useRef } from "react";

/** A hook for keeping the screen awake */
export default function useWakeLock() {
  /** The held wake lock */
  const wakeLockRef = useRef(null);

  /** The holding of the screen wake lock */
  useEffect(() => {
    /** The request of a new wake lock */
    const requestWakeLock = async () => {
      try {
        wakeLockRef.current?.release();
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch (e) {
        console.error(e);
      }
    };

    /** The handler of visibility changes */
    const handleVisibilityChange = async () => {
      if (
        wakeLockRef.current !== null &&
        document.visibilityState === "visible"
      ) {
        await requestWakeLock();
      }
    };

    /** Watch Visibility Change */
    document.addEventListener("visibilitychange", handleVisibilityChange);

    /** Request initial WakeLock */
    requestWakeLock();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, []);
}

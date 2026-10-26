import { useCallback, useState } from "react";

/** A hook for counting progress toward a target */
const useProgress = () => {
  /** The number of items to reach */
  const [target, setTarget] = useState(0);
  /** The number of items done */
  const [progress, setProgress] = useState(0);

  /** The reset of the target and progress */
  const resetProgress = useCallback(() => {
    setTarget(0);
    setProgress(0);
  }, []);

  /** The increment of the progress */
  const incrementProgress = useCallback(
    () => setProgress((prev) => prev + 1),
    [],
  );

  return {
    target,
    progress,
    setTarget,
    resetProgress,
    incrementProgress,
  };
};

export { useProgress };

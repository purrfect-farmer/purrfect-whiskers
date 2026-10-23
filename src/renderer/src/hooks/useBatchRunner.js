import { useCallback, useState } from "react";

import { MAX_CONCURRENT_BACKUPS } from "../lib/constants";
import { runInChunks } from "../lib/utils";
import { useProgress } from "./useProgress";

/** Runs a task over many items in chunks, tracking its progress */
export default function useBatchRunner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  const run = useCallback(
    async (items, task) => {
      setIsProcessing(true);
      resetProgress();
      setTarget(items.length);

      try {
        return await runInChunks(
          items,
          MAX_CONCURRENT_BACKUPS,
          async (item) => {
            const result = await task(item);
            incrementProgress();
            return result;
          },
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [resetProgress, setTarget, incrementProgress],
  );

  return { isProcessing, target, progress, run };
}

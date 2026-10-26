import { useCallback, useState } from "react";

import { MAX_CONCURRENT_WEBVIEWS } from "../lib/constants";
import { holdPartitions } from "../lib/busyPartitions";
import { runWithLimit } from "../lib/utils";
import { useProgress } from "./useProgress";

/** A hook for running a task over many items, a few at a time, with progress */
export default function useBatchRunner() {
  /** Whether a batch is running */
  const [isProcessing, setIsProcessing] = useState(false);
  /** The progress of the batch */
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  /**
   * The run of a task over items; `partitions` stay busy for the whole run
   * and `onBatch` gets finished results in small groups.
   */
  const run = useCallback(
    async (items, task, { partitions = [], onBatch } = {}) => {
      const release = holdPartitions(partitions);

      setIsProcessing(true);
      resetProgress();
      setTarget(items.length);

      try {
        return await runWithLimit(
          items,
          MAX_CONCURRENT_WEBVIEWS,
          async (item) => {
            const result = await task(item);
            incrementProgress();
            return result;
          },
          onBatch,
        );
      } finally {
        release();
        setIsProcessing(false);
      }
    },
    [resetProgress, setTarget, incrementProgress],
  );

  return { isProcessing, target, progress, run };
}

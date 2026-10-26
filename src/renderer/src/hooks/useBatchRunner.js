import { useCallback, useState } from "react";

import { MAX_CONCURRENT_WEBVIEWS } from "../lib/constants";
import { holdPartitions } from "../lib/busyPartitions";
import { runInChunks } from "../lib/utils";
import { useProgress } from "./useProgress";

/** A hook for running a task over many items in chunks with progress */
export default function useBatchRunner() {
  /** Whether a batch is running */
  const [isProcessing, setIsProcessing] = useState(false);
  /** The progress of the batch */
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

  /**
   * The run of a task over items; `partitions` stay busy for the whole run
   * and `onChunk` gets each chunk's results.
   */
  const run = useCallback(
    async (items, task, { partitions = [], onChunk } = {}) => {
      const release = holdPartitions(partitions);

      setIsProcessing(true);
      resetProgress();
      setTarget(items.length);

      try {
        return await runInChunks(
          items,
          MAX_CONCURRENT_WEBVIEWS,
          async (item) => {
            const result = await task(item);
            incrementProgress();
            return result;
          },
          onChunk,
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

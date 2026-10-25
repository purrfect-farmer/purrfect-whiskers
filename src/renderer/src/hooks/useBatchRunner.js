import { useCallback, useState } from "react";

import { MAX_CONCURRENT_WEBVIEWS } from "../lib/constants";
import { holdPartitions } from "../lib/busyPartitions";
import { runInChunks } from "../lib/utils";
import { useProgress } from "./useProgress";

/**
 * Runs a task over many items in chunks, tracking its progress.
 * `partitions` stay busy for the whole run, so none of them can be opened
 * before or after its turn, and `onChunk` gets each chunk's results.
 */
export default function useBatchRunner() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useProgress();

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

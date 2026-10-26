/** Partitions a hidden webview is using, with how many tasks hold each */
const holds = new Map();

/** Marks partitions as in use until the returned release is called */
export function holdPartitions(partitions) {
  for (const partition of partitions) {
    holds.set(partition, (holds.get(partition) ?? 0) + 1);
  }

  /** Whether the partitions were released */
  let released = false;

  return () => {
    if (released) return;
    released = true;

    for (const partition of partitions) {
      /** The remaining holds of the partition */
      const count = holds.get(partition) - 1;

      if (count > 0) {
        holds.set(partition, count);
      } else {
        holds.delete(partition);
      }
    }
  };
}

/** Whether a hidden webview is using a partition */
export function isPartitionBusy(partition) {
  return holds.has(partition);
}

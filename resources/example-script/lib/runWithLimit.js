/**
 * Runs `task` on every item, at most `limit` at a time, keeping the order.
 * No new item starts once `signal` is aborted; skipped items stay null.
 */
export async function runWithLimit(items, limit, signal, task) {
  /** The result of each item, by position */
  const results = new Array(items.length).fill(null);

  /** The position of the next item to start */
  let next = 0;

  /** A worker taking items until none are left */
  const worker = async () => {
    while (next < items.length && !signal.aborted) {
      const index = next++;

      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(Array.from({ length: limit }, worker));

  return results;
}

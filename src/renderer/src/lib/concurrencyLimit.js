/** A limiter running at most `limit` tasks at once, queueing the rest */
export function createConcurrencyLimit(limit) {
  /** The number of tasks running */
  let active = 0;

  /** The tasks waiting to run */
  const queue = [];

  /** Starts the next queued task when there is room */
  const next = () => {
    if (active >= limit || queue.length === 0) return;

    active++;

    const { task, resolve, reject } = queue.shift();

    task()
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };

  return (task) =>
    new Promise((resolve, reject) => {
      queue.push({ task, resolve, reject });
      next();
    });
}

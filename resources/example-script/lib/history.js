/** The storage key of the script's run history */
const HISTORY_KEY = "history";

/** A time since `time`, e.g. "5 minutes ago" */
function describeSince(time) {
  /** The minutes since the time */
  const minutes = Math.round((Date.now() - time) / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute(s) ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} hour(s) ago`;

  return `${Math.round(minutes / (60 * 24))} day(s) ago`;
}

/**
 * Records this run in api.storage, which keeps values between runs, and
 * returns a line describing the previous run
 */
export async function recordRun(api) {
  /** The history saved by earlier runs, or null on the first one */
  const history = await api.storage.get(HISTORY_KEY);
  /** The number of this run */
  const count = (history?.count ?? 0) + 1;

  await api.storage.set(HISTORY_KEY, { count, lastRunAt: Date.now() });

  return history
    ? `Run #${count}; the last one was ${describeSince(history.lastRunAt)}`
    : "First run of this script";
}

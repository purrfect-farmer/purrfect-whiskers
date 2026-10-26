import { SESSION_STATUS } from "../../../shared/constants/sessionStatus";
import { backupAccountUnlessActive } from "./accountSession";

/** Titles named in a summary before the rest are counted */
const MAX_NAMED_TITLES = 3;

/** Copy of a Map with the entries set */
export const withEntries = (map, entries) => {
  const next = new Map(map);

  entries.forEach(([key, value]) => next.set(key, value));

  return next;
};

/** Copy of a Map without the keys */
export const withoutKeys = (map, keys) => {
  const next = new Map(map);

  keys.forEach((key) => next.delete(key));

  return next;
};

/** Copy of a Set with the values added */
export const withValues = (set, values) => new Set([...set, ...values]);

/** Back an account up unless it is active now, never rejecting */
export async function getCleanOutcome(account) {
  try {
    const { status, backup } = await backupAccountUnlessActive(account);

    return { account, status, backup };
  } catch (error) {
    console.error(error);

    return { account, status: null, backup: null };
  }
}

/** The titles of accounts as "a, b, c and 2 more" */
const nameAccounts = (accounts) => {
  /** The named titles */
  const titles = accounts.slice(0, MAX_NAMED_TITLES).map((item) => item.title);
  /** The number of accounts left unnamed */
  const rest = accounts.length - titles.length;

  return rest > 0 ? `${titles.join(", ")} and ${rest} more` : titles.join(", ");
};

/** One line per kind of outcome of a clean */
export function summarizeClean(outcomes, removed) {
  /** The removed partitions */
  const removedSet = new Set(removed);

  /** The outcomes of accounts signed in again */
  const active = outcomes.filter(
    (item) => item.status === SESSION_STATUS.ACTIVE,
  );
  /** The outcomes of accounts that could not be backed up */
  const notBackedUp = outcomes.filter(
    (item) => item.status !== SESSION_STATUS.ACTIVE && !item.backup,
  );
  /** The outcomes of backed-up accounts that could not be removed */
  const notRemoved = outcomes.filter(
    (item) => item.backup && !removedSet.has(item.account.partition),
  );

  return [
    `Removed ${removed.length} account(s).`,
    active.length ? `Kept ${nameAccounts(active)}, signed in again.` : null,
    notBackedUp.length
      ? `Could not back up ${nameAccounts(notBackedUp)}.`
      : null,
    notRemoved.length ? `Could not remove ${nameAccounts(notRemoved)}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

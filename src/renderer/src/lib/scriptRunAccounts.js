import { holdPartitions } from "./busyPartitions";
import useAppStore from "../store/useAppStore";

/** The partitions of the running script's accounts */
const partitions = new Set();

/** The release of each run account's hold, while the account is closed */
const holds = new Map();

/** Holds an account so nothing else opens it during the run */
function hold(partition) {
  if (!holds.has(partition)) holds.set(partition, holdPartitions([partition]));
}

/** Makes `list` the run's accounts, holding each of them */
export function holdRunAccounts(list) {
  releaseRunAccounts();

  for (const partition of list) {
    partitions.add(partition);
    hold(partition);
  }
}

/** Releases every account of the run */
export function releaseRunAccounts() {
  for (const release of holds.values()) release();

  holds.clear();
  partitions.clear();
}

/** Whether an account is part of the run */
export function isRunAccount(partition) {
  return partitions.has(partition);
}

/** Adds an account to the run, held like the others */
export function addRunAccount(partition) {
  partitions.add(partition);
  hold(partition);
}

/** Opens a run account for the user, releasing its hold while it is open */
export function showRunAccount(partition) {
  holds.get(partition)?.();
  holds.delete(partition);
  useAppStore.getState().launchAccount(partition);

  /** Whether the account opened */
  const isOpen = useAppStore
    .getState()
    .accounts.some((item) => item.partition === partition && item.running);

  if (!isOpen) {
    hold(partition);
    throw new Error("The account is busy with another task");
  }
}

/** Removes an account from the run, releasing its hold */
export function removeRunAccount(partition) {
  holds.get(partition)?.();
  holds.delete(partition);
  partitions.delete(partition);
}

/** Closes a run account and holds it again */
export function hideRunAccount(partition) {
  useAppStore.getState().closeAccount(partition);
  hold(partition);
}

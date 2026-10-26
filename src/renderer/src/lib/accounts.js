import { IPC } from "../../../shared/constants/ipc";
import pLimit from "p-limit";
import useAppStore from "../store/useAppStore";

/** Close the running accounts and open them again on the next frame */
export function reloadRunningAccounts() {
  const { accounts, closeAllAccounts } = useAppStore.getState();
  /** The partitions of the running accounts */
  const partitions = new Set(
    accounts.filter((item) => item.running).map((item) => item.partition),
  );

  closeAllAccounts();

  requestAnimationFrame(() => {
    useAppStore.getState().openAccounts(partitions);
  });
}

/**
 * Close an account, wipe its session data, then remove it.
 * The account stays listed when wiping fails.
 */
export async function deleteAccount(partition) {
  useAppStore.getState().closeAccount(partition);

  await window.electron.ipcRenderer.invoke(IPC.REMOVE_SESSION, partition);

  useAppStore.getState().removeAccount(partition);
}

/** The number of sessions wiped at the same time */
const MAX_CONCURRENT_WIPES = 4;

/**
 * Close accounts, wipe their session data a few at a time, then remove the
 * wiped ones at once, resolving with the partitions removed
 */
export async function deleteAccounts(partitions) {
  useAppStore.getState().closeAccounts(partitions);

  /** The limit on sessions wiped at once */
  const limitWipes = pLimit(MAX_CONCURRENT_WIPES);

  /** The partitions wiped */
  const removed = [];

  await Promise.all(
    partitions.map((partition) =>
      limitWipes(() =>
        window.electron.ipcRenderer
          .invoke(IPC.REMOVE_SESSION, partition)
          .then(() => removed.push(partition))
          .catch((error) => console.error(error)),
      ),
    ),
  );

  useAppStore.getState().removeAccounts(removed);

  return removed;
}

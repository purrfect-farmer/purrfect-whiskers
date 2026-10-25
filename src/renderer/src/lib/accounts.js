import { IPC } from "../../../shared/constants/ipc";
import useAppStore from "../store/useAppStore";

/** Close the running accounts and open them again on the next frame */
export function reloadRunningAccounts() {
  const { accounts, closeAllAccounts } = useAppStore.getState();
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

/** Delete accounts one at a time, resolving with the partitions removed */
export async function deleteAccounts(partitions) {
  const removed = [];

  for (const partition of partitions) {
    try {
      await deleteAccount(partition);
      removed.push(partition);
    } catch (error) {
      console.error(error);
    }
  }

  return removed;
}

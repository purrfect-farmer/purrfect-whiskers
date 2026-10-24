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

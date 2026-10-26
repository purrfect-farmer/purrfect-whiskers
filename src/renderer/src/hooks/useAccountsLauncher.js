import { useCallback, useMemo, useState } from "react";

import toast from "react-hot-toast";
import useAccountsSelector from "./useAccountsSelector";
import useAppStore from "../store/useAppStore";

const SELECTOR_OPTIONS = { initiallySelected: false };

/** A hook for selecting accounts and launching them at once */
export default function useAccountsLauncher(accounts) {
  /** Whether the list is in select mode */
  const [selecting, setSelecting] = useState(false);

  /** The selection of accounts to launch */
  const selector = useAccountsSelector(accounts, SELECTOR_OPTIONS);
  const { selectedAccounts, setSelected } = selector;

  /** The switch in and out of select mode, clearing the selection */
  const toggleSelecting = useCallback(() => {
    setSelecting((prev) => !prev);
    setSelected(new Set());
  }, [setSelected]);

  /** The submit handler that launches the selected accounts */
  const onSubmit = useCallback(
    (ev) => {
      ev.preventDefault();

      const busyCount = useAppStore
        .getState()
        .launchAccounts(selectedAccounts.map((account) => account.partition));

      if (busyCount > 0) {
        toast.error(`${busyCount} account(s) are busy with a background task.`);
      }
    },
    [selectedAccounts],
  );

  return useMemo(
    () => ({ selecting, toggleSelecting, selector, onSubmit }),
    [selecting, toggleSelecting, selector, onSubmit],
  );
}

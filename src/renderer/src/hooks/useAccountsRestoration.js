import { useEffect } from "react";

import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";

/** Whether the accounts have been restored */
let restored = false;

/** Closes the accounts left open by the last run unless set to restore */
function restoreAccounts() {
  if (
    restored ||
    !useAppStore.persist.hasHydrated() ||
    !useSettingsStore.persist.hasHydrated()
  ) {
    return;
  }

  restored = true;

  if (!useSettingsStore.getState().restoreAccountsOnStartup) {
    useAppStore.getState().closeAllAccounts();
  }
}

/** A hook for restoring or closing the last run's open accounts */
export default function useAccountsRestoration() {
  /** The restoration once both stores have loaded */
  useEffect(() => {
    const unsubscribeApp =
      useAppStore.persist.onFinishHydration(restoreAccounts);
    const unsubscribeSettings =
      useSettingsStore.persist.onFinishHydration(restoreAccounts);

    restoreAccounts();

    return () => {
      unsubscribeApp();
      unsubscribeSettings();
    };
  }, []);
}

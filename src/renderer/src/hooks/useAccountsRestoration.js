import { useEffect } from "react";

import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";

let restored = false;

/**
 * Closes the accounts left open by the last run, unless the user chose to
 * restore them. Runs once, after both stores have loaded from storage.
 */
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

export default function useAccountsRestoration() {
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

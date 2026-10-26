import { WEBVIEW_ACTION, WEBVIEW_CHANNEL } from "../../../shared/constants/ipc";
import { useCallback, useEffect, useMemo, useState } from "react";

import { uuid } from "../lib/utils";

/** The URL of a new tab */
const DEFAULT_URL = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;

/** Creates a new active tab */
const createTab = (url = DEFAULT_URL) => ({
  id: uuid(),
  active: true,
  title: "New Tab",
  url,
});

/** A hook for the tabs of an account's browser */
export default function useBrowser(partition) {
  /** Whether the browser has been opened */
  const [enabled, setEnabled] = useState(false);
  /** Whether the browser is shown */
  const [shown, setShown] = useState(false);

  /** The list of tabs */
  const [tabs, setTabs] = useState(() => [createTab()]);

  /** The toggle of the browser */
  const toggle = useCallback(() => {
    setEnabled(true);
    setShown((prev) => !prev);
  }, []);

  /** The setter of the active tab */
  const setActiveTab = useCallback((id) => {
    setTabs((prev) =>
      prev.map((item) => ({ ...item, active: item.id === id })),
    );
  }, []);

  /** The addition of a new active tab */
  const addTab = useCallback(({ url } = {}) => {
    setEnabled(true);
    setShown(true);
    setTabs((prev) => [
      ...prev.map((item) => ({ ...item, active: false })),
      createTab(url),
    ]);
  }, []);

  /** The removal of a tab */
  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      /** The index of the closed tab */
      const itemIndex = prev.findIndex((item) => item.id === id);

      if (itemIndex > -1) {
        /** Whether the closed tab was active */
        const wasActive = prev[itemIndex].active;
        /** The remaining tabs */
        const result = prev
          .filter((tab) => tab.id !== id)
          .map((tab, index) => ({
            ...tab,
            active: wasActive
              ? index === Math.max(itemIndex - 1, 0)
              : tab.active,
          }));
        return result;
      } else {
        return prev;
      }
    });
  }, []);

  /** The setter of a tab's title */
  const updateTitle = useCallback((id, title) => {
    setTabs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item)),
    );
  }, []);

  /** The setter of a tab's icon */
  const updateIcon = useCallback((id, icons) => {
    setTabs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, icon: icons[0] } : item)),
    );
  }, []);

  /** The opening of new windows as tabs */
  useEffect(() => {
    /** The listener for browser messages */
    const listener = (ev, args) => {
      const { id, action, data } = args;
      if (id === partition) {
        switch (action) {
          case WEBVIEW_ACTION.OPEN_WINDOW:
            addTab(data);
            break;
        }
      }
    };

    /** Add Listener */
    window.electron.ipcRenderer.on(WEBVIEW_CHANNEL.BROWSER_MESSAGE, listener);

    return () => {
      /** Remove Listener */
      window.electron.ipcRenderer.removeListener(
        WEBVIEW_CHANNEL.BROWSER_MESSAGE,
        listener,
      );
    };
  }, [partition, addTab]);

  return useMemo(
    () => ({
      tabs,
      enabled,
      shown,
      addTab,
      closeTab,
      setActiveTab,
      updateTitle,
      updateIcon,
      toggle,
    }),
    [
      tabs,
      enabled,
      shown,
      addTab,
      closeTab,
      setActiveTab,
      updateTitle,
      updateIcon,
      toggle,
    ],
  );
}

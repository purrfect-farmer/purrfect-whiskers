import { WEBVIEW_ACTION, WEBVIEW_CHANNEL } from "../../../shared/constants/ipc";
import { useCallback, useEffect, useMemo, useState } from "react";

import { uuid } from "../lib/utils";

const DEFAULT_URL = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;

/** Create a new active tab */
const createTab = (url = DEFAULT_URL) => ({
  id: uuid(),
  active: true,
  title: "New Tab",
  url,
});

export default function useBrowser(partition) {
  const [enabled, setEnabled] = useState(false);
  const [shown, setShown] = useState(false);

  /** Tabs State */
  const [tabs, setTabs] = useState(() => [createTab()]);

  /** Toggle Browser */
  const toggle = useCallback(() => {
    setEnabled(true);
    setShown((prev) => !prev);
  }, []);

  /** Set Active Tab */
  const setActiveTab = useCallback((id) => {
    setTabs((prev) =>
      prev.map((item) => ({ ...item, active: item.id === id })),
    );
  }, []);

  /** Add Tab */
  const addTab = useCallback(({ url } = {}) => {
    setEnabled(true);
    setShown(true);
    setTabs((prev) => [
      ...prev.map((item) => ({ ...item, active: false })),
      createTab(url),
    ]);
  }, []);

  /** Close Tab */
  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      /** Get Index */
      const itemIndex = prev.findIndex((item) => item.id === id);

      if (itemIndex > -1) {
        const wasActive = prev[itemIndex].active;
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

  /** Update Title */
  const updateTitle = useCallback((id, title) => {
    setTabs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item)),
    );
  }, []);

  /** Update Icon */
  const updateIcon = useCallback((id, icons) => {
    setTabs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, icon: icons[0] } : item)),
    );
  }, []);

  /** Handle New Window Open */
  useEffect(() => {
    /** Listen for Window Open */
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

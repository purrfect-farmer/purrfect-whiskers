import { REORDER_MODE, THEME } from "../lib/constants";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { create } from "zustand";

import { storage } from "./storage";

/** The store of the app settings */
export default create(
  persist(
    combine(
      {
        /** The extension folder */
        extensionPath: import.meta.env.VITE_EXTENSION_PATH || "",
        /** Whether the extension updates automatically */
        autoUpdateExtension: true,
        /** Whether webviews show their toolbar */
        showWebviewToolbar: true,
        /** Whether running accounts are restored on startup */
        restoreAccountsOnStartup: true,
        /** Whether account details are shown */
        showAccountDetails: true,
        /** The way accounts are reordered */
        accountsReorderMode: REORDER_MODE.VIRTUAL,
        /** Whether account proxies are used */
        allowProxies: false,
        /** The app theme */
        theme: THEME.SYSTEM,
        /** The number of webview columns per page */
        columns: 4,
        /** The number of webview rows per page */
        rows: 1,
        /** The folder holding the user scripts */
        scriptsFolder: "",
      },
      (set) => ({
        setColumns: (columns) => set({ columns }),
        setRows: (rows) => set({ rows }),
        setTheme: (theme) => set({ theme }),
        setExtensionPath: (extensionPath) => set({ extensionPath }),
        setScriptsFolder: (scriptsFolder) => set({ scriptsFolder }),
        setAutoUpdateExtension: (autoUpdateExtension) =>
          set({ autoUpdateExtension }),
        setAllowProxies: (allowProxies) => set({ allowProxies }),
        setShowAccountDetails: (showAccountDetails) =>
          set({ showAccountDetails }),
        setAccountsReorderMode: (accountsReorderMode) =>
          set({ accountsReorderMode }),
        setShowWebviewToolbar: (showWebviewToolbar) =>
          set({ showWebviewToolbar }),
        setRestoreAccountsOnStartup: (restoreAccountsOnStartup) =>
          set({ restoreAccountsOnStartup }),
      }),
    ),
    {
      name: "settings-store", // unique name
      storage: createJSONStorage(() => storage),
    },
  ),
);

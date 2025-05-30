import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";

export default create(
  persist(
    combine(
      {
        extensionPath: import.meta.env.VITE_EXTENSION_PATH || "",
        showWebviewToolbar: true,
        restoreAccountsOnStartup: true,
        showAccountDetails: true,
        allowProxies: true,
        theme: "system",
        columns: 4,
        rows: 1,
      },
      (set) => ({
        setColumns: (columns) => set({ columns }),
        setRows: (rows) => set({ rows }),
        setTheme: (theme) => set({ theme }),
        setExtensionPath: (extensionPath) => set({ extensionPath }),
        setAllowProxies: (allowProxies) => set({ allowProxies }),
        setShowAccountDetails: (showAccountDetails) =>
          set({ showAccountDetails }),
        setShowWebviewToolbar: (showWebviewToolbar) =>
          set({ showWebviewToolbar }),
        setRestoreAccountsOnStartup: (restoreAccountsOnStartup) =>
          set({ restoreAccountsOnStartup }),
      })
    ),
    {
      name: "settings-store", // unique name
      storage: createJSONStorage(() => storage),
    }
  )
);

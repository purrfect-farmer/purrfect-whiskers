import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";

export default create(
  persist(
    combine(
      {
        extensionPath: import.meta.env.VITE_EXTENSION_PATH || "",
        showWebviewToolbar: true,
        enableProxies: true,
        theme: "system",
        columns: 4,
        rows: 1,
      },
      (set) => ({
        setColumns: (columns) => set({ columns }),
        setRows: (rows) => set({ rows }),
        setTheme: (theme) => set({ theme }),
        setExtensionPath: (extensionPath) => set({ extensionPath }),
        setEnableProxies: (enableProxies) => set({ enableProxies }),
        setShowWebviewToolbar: (showWebviewToolbar) =>
          set({ showWebviewToolbar }),
      })
    ),
    {
      name: "settings-store", // unique name
      storage: createJSONStorage(() => storage),
    }
  )
);

import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";

export default create(
  persist(
    combine(
      {
        extensionPath: import.meta.env.VITE_EXTENSION_PATH || "",
        showWebviewToolbar: true,
        theme: "system",
        columns: 4,
        rows: 1,
      },
      (set) => ({
        setColumns: (columns) => set({ columns }),
        setRows: (rows) => set({ rows }),
        setTheme: (theme) => set({ theme }),
        setExtensionPath: (extensionPath) => set({ extensionPath }),
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

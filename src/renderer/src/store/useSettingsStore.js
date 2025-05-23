import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";

export default create(
  persist(
    combine(
      {
        extensionPath: import.meta.env.VITE_EXTENSION_PATH || "",
        columns: 4,
        rows: 1,
      },
      (set) => ({
        setColumns: (columns) => set({ columns }),
        setRows: (rows) => set({ rows }),
        setExtensionPath: (extensionPath) => set({ extensionPath }),
      })
    ),
    {
      name: "settings-store", // unique name
      storage: createJSONStorage(() => storage),
    }
  )
);

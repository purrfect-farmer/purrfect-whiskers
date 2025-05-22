import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { storage } from './storage'

export default create(
  persist(
    (set) => ({
      extensionPath: import.meta.env.VITE_EXTENSION_PATH || '',
      columns: 5,
      rows: 1,
      setColumns: (columns) => set({ columns }),
      setRows: (rows) => set({ rows }),
      setExtensionPath: (extensionPath) => set({ extensionPath })
    }),
    {
      name: 'settings-store', // unique name
      storage: createJSONStorage(() => storage)
    }
  )
)

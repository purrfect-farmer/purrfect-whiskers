import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { storage } from "./storage";

export default create(
  persist(
    (set, get) => ({
      accounts: [],
      partitions: [],

      addAccount: (data) => set({ accounts: [...get().accounts, data] }),
      setAccounts: (accounts) => set({ accounts }),
      updateAccount: (account) =>
        set({
          accounts: get().accounts.map((item) =>
            item.partition === account.partition ? account : item
          ),
        }),
      removeAccount: (partition) =>
        set({
          accounts: get().accounts.filter(
            (item) => item.partition !== partition
          ),
        }),

      setPartitions: (partitions) => set({ partitions }),
      launchPartition: (id) =>
        set({
          partitions: new Set(get().partitions).add(id).values().toArray(),
        }),
      closePartition: (id) => {
        const entries = new Set(get().partitions);

        /** Delete Partition */
        entries.delete(id);

        return set({ partitions: entries.values().toArray() });
      },
    }),
    {
      name: "app-store", // unique name
      storage: createJSONStorage(() => storage),
      partialize: ({ accounts }) => ({
        accounts,
      }),
    }
  )
);

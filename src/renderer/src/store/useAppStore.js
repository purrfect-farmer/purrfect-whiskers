import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";

export default create(
  persist(
    combine(
      {
        page: 0,
        accounts: [],
        partitions: [],
      },
      (set, get) => ({
        setPage: (page) => set({ page }),

        addAccount: (data) => set({ accounts: [...get().accounts, data] }),
        setAccounts: (accounts) => set({ accounts }),
        updateAccount: (data) =>
          set({
            accounts: get().accounts.map((item) =>
              item.partition === data.partition ? { ...item, ...data } : item
            ),
          }),
        removeAccount: (partition) =>
          set({
            accounts: get().accounts.filter(
              (item) => item.partition !== partition
            ),
          }),

        setPartitions: (partitions) => set({ partitions }),
        addPartition: (id, page) =>
          set({
            partitions: [...get().partitions, id],
            page,
          }),
        closePartition: (id) => {
          return set({
            partitions: get().partitions.filter((item) => id !== item),
          });
        },
      })
    ),
    {
      name: "app-store", // unique name
      storage: createJSONStorage(() => storage),
    }
  )
);

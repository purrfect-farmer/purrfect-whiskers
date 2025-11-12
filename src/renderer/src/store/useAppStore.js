import { combine, createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import { storage } from "./storage";
import useSettingsStore from "./useSettingsStore";

export default create(
  persist(
    combine(
      {
        page: 0,
        accounts: [],
        spiderApiKey: null,
      },
      (set, get) => ({
        setPage: (page) => set({ page }),
        setSpiderApiKey: (key) => set({ spiderApiKey: key }),

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

        closeAccount: (partition) =>
          set({
            accounts: get().accounts.map((item) =>
              item.partition === partition ? { ...item, running: false } : item
            ),
          }),

        closeAllAccounts: () =>
          set({
            accounts: get().accounts.map((item) => ({
              ...item,
              running: false,
            })),
          }),

        closePage: (pageIndex) => {
          const { accounts } = get();
          const { columns, rows } = useSettingsStore.getState();
          const itemsPerPage = columns * rows;

          const partitions = accounts
            .filter((item) => item.running)
            .filter(
              (_, index) => pageIndex === Math.floor(index / itemsPerPage)
            )
            .map((item) => item.partition);

          set({
            accounts: accounts.map((item) =>
              partitions.includes(item.partition)
                ? { ...item, running: false }
                : item
            ),
          });
        },

        launchAccount: (partition) => {
          const { accounts } = get();
          const { columns, rows } = useSettingsStore.getState();
          const itemsPerPage = columns * rows;

          const isRunning = accounts.some(
            (item) => item.partition === partition && item.running
          );

          const newAccounts = isRunning
            ? accounts
            : accounts.map((item) =>
                item.partition === partition ? { ...item, running: true } : item
              );

          const index = newAccounts
            .filter((item) => item.running)
            .findIndex((item) => item.partition === partition);
          const pageIndex = Math.floor(index / itemsPerPage);

          set({ accounts: newAccounts, page: pageIndex });
        },
      })
    ),
    {
      name: "app-store", // unique name
      storage: createJSONStorage(() => storage),
    }
  )
);

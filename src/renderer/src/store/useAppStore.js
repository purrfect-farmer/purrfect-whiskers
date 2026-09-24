import { combine, createJSONStorage, persist } from "zustand/middleware";

import { create } from "zustand";
import { getTelegramUser } from "../lib/utils";
import { storage } from "./storage";
import useSettingsStore from "./useSettingsStore";

export default create(
  persist(
    combine(
      {
        page: 0,
        accounts: [],
        tags: [],
        spiderApiKey: null,
        proxyProvider: "webshare",
        proxyApiKey: null,
        proxies: [],
      },
      (set, get) => ({
        setPage: (page) => set({ page }),
        setSpiderApiKey: (key) => set({ spiderApiKey: key }),

        /** Proxies */
        setProxyProvider: (proxyProvider) => set({ proxyProvider }),
        setProxyApiKey: (proxyApiKey) => set({ proxyApiKey }),
        setProxies: (proxies) => set({ proxies }),

        /** Assigns proxies to accounts in order, reusing them when exhausted */
        applyProxies: (partitions, proxies) => {
          if (!proxies.length) return;

          const indexes = new Map(
            partitions.map((partition, index) => [partition, index]),
          );

          set({
            accounts: get().accounts.map((item) => {
              if (!indexes.has(item.partition)) return item;

              const proxy =
                proxies[indexes.get(item.partition) % proxies.length];

              return {
                ...item,
                proxyEnabled: true,
                proxyHost: proxy.host,
                proxyPort: String(proxy.port),
                proxyUsername: proxy.username || null,
                proxyPassword: proxy.password || null,
              };
            }),
          });
        },

        addAccount: (data) => set({ accounts: [...get().accounts, data] }),
        importAccounts: (data) => {
          const existing = get().accounts;
          const filtered = data.filter(
            (item) =>
              !existing.some((account) => account.partition === item.partition),
          );

          return set({ accounts: [...existing, ...filtered] });
        },
        setAccounts: (accounts) => set({ accounts }),

        /** Moves an account to a new (final) index, clamped to the list */
        moveAccount: (partition, toIndex) => {
          const { accounts } = get();
          const fromIndex = accounts.findIndex(
            (item) => item.partition === partition,
          );

          if (fromIndex < 0) return;

          const target = Math.max(0, Math.min(toIndex, accounts.length - 1));

          if (target === fromIndex) return;

          const next = [...accounts];
          const [moved] = next.splice(fromIndex, 1);

          next.splice(target, 0, moved);

          return set({ accounts: next });
        },
        updateAccount: (data) =>
          set({
            accounts: get().accounts.map((item) =>
              item.partition === data.partition ? { ...item, ...data } : item,
            ),
          }),
        removeAccount: (partition) =>
          set({
            accounts: get().accounts.filter(
              (item) => item.partition !== partition,
            ),
          }),

        closeAccount: (partition) =>
          set({
            accounts: get().accounts.map((item) =>
              item.partition === partition ? { ...item, running: false } : item,
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
              (_, index) => pageIndex === Math.floor(index / itemsPerPage),
            )
            .map((item) => item.partition);

          set({
            accounts: accounts.map((item) =>
              partitions.includes(item.partition)
                ? { ...item, running: false }
                : item,
            ),
          });
        },

        launchAccount: (partition) => {
          const { accounts } = get();
          const { columns, rows } = useSettingsStore.getState();
          const itemsPerPage = columns * rows;

          const isRunning = accounts.some(
            (item) => item.partition === partition && item.running,
          );

          const newAccounts = isRunning
            ? accounts
            : accounts.map((item) =>
                item.partition === partition
                  ? { ...item, running: true }
                  : item,
              );

          const index = newAccounts
            .filter((item) => item.running)
            .findIndex((item) => item.partition === partition);
          const pageIndex = Math.floor(index / itemsPerPage);

          set({ accounts: newAccounts, page: pageIndex });
        },

        /** Launch an account by partition or telegram user id */
        launchAccountByRequest: (request) => {
          const { partition, telegramUserId } = request || {};
          const { accounts } = get();

          const userId = String(telegramUserId ?? "").trim();

          if (!partition && !userId) {
            return { success: false, error: "INVALID_REQUEST" };
          }

          const account = partition
            ? accounts.find((item) => item.partition === partition)
            : accounts.find((item) => {
                const user = getTelegramUser(item);
                return user ? String(user["id"]) === userId : false;
              });

          if (!account) {
            return { success: false, error: "ACCOUNT_NOT_FOUND" };
          }

          get().launchAccount(account.partition);

          return { success: true, partition: account.partition };
        },

        /** Tags */
        addTag: (tag) => set({ tags: [...get().tags, tag] }),
        removeTag: (id) =>
          set({
            tags: get().tags.filter((item) => item.id !== id),
            accounts: get().accounts.map((account) => ({
              ...account,
              tags: account.tags?.filter?.((tagId) => tagId !== id),
            })),
          }),
        updateTag: (id, name) =>
          set({
            tags: get().tags.map((item) =>
              item.id === id ? { ...item, name } : item,
            ),
          }),
        setTags: (tags) => set({ tags }),
      }),
    ),
    {
      name: "app-store", // unique name
      storage: createJSONStorage(() => storage),
    },
  ),
);

import { LAUNCH_ERROR, PROXY_PROVIDER } from "../lib/constants";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { create } from "zustand";
import { getTelegramUser } from "../lib/utils";
import { storage } from "./storage";
import useFlashStore from "./useFlashStore";
import useSettingsStore from "./useSettingsStore";

/** Number of webviews shown per page */
const getItemsPerPage = () => {
  const { columns, rows } = useSettingsStore.getState();
  return columns * rows;
};

/**
 * Sets `running` on the accounts in `partitions`, or on all with `null`.
 * Returns the same array when nothing changes.
 */
const setRunning = (accounts, partitions, running) => {
  let changed = false;

  const next = accounts.map((item) => {
    const matches = partitions === null || partitions.has(item.partition);

    if (!matches || Boolean(item.running) === running) return item;

    changed = true;
    return { ...item, running };
  });

  return changed ? next : accounts;
};

export default create(
  persist(
    combine(
      {
        page: 0,
        accounts: [],
        tags: [],
        spiderApiKey: null,
        proxyProvider: PROXY_PROVIDER.WEBSHARE,
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
          const partitions = new Set(existing.map((item) => item.partition));

          return set({
            accounts: [
              ...existing,
              ...data.filter((item) => !partitions.has(item.partition)),
            ],
          });
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
            accounts: setRunning(get().accounts, new Set([partition]), false),
          }),

        closeAllAccounts: () =>
          set({ accounts: setRunning(get().accounts, null, false) }),

        closePage: (pageIndex) => {
          const { accounts } = get();
          const itemsPerPage = getItemsPerPage();

          const partitions = new Set(
            accounts
              .filter((item) => item.running)
              .slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
              .map((item) => item.partition),
          );

          set({ accounts: setRunning(accounts, partitions, false) });
        },

        /** Opens an account, shows its page and flashes it */
        launchAccount: (partition) => {
          const accounts = setRunning(
            get().accounts,
            new Set([partition]),
            true,
          );

          const index = accounts
            .filter((item) => item.running)
            .findIndex((item) => item.partition === partition);

          if (index < 0) return;

          set({
            accounts,
            page: Math.floor(index / getItemsPerPage()),
          });

          useFlashStore.getState().flash(partition);
        },

        /** Launch an account by partition or telegram user id */
        launchAccountByRequest: (request) => {
          const { partition, telegramUserId } = request || {};
          const { accounts } = get();

          const userId = String(telegramUserId ?? "").trim();

          if (!partition && !userId) {
            return { success: false, error: LAUNCH_ERROR.INVALID_REQUEST };
          }

          const account = partition
            ? accounts.find((item) => item.partition === partition)
            : accounts.find((item) => {
                const user = getTelegramUser(item);
                return user ? String(user["id"]) === userId : false;
              });

          if (!account) {
            return { success: false, error: LAUNCH_ERROR.ACCOUNT_NOT_FOUND };
          }

          get().launchAccount(account.partition);

          return { success: true, partition: account.partition };
        },

        /** Tags */
        addTag: (tag) => set({ tags: [...get().tags, tag] }),
        removeTag: (id) =>
          set({
            tags: get().tags.filter((item) => item.id !== id),
            accounts: get().accounts.map((account) =>
              account.tags?.includes(id)
                ? {
                    ...account,
                    tags: account.tags.filter((tagId) => tagId !== id),
                  }
                : account,
            ),
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

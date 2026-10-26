import { LAUNCH_ERROR, PROXY_PROVIDER } from "../lib/constants";
import { applyTagChanges } from "../lib/tags";
import { combine, createJSONStorage, persist } from "zustand/middleware";

import { create } from "zustand";
import { getTelegramUser } from "../lib/utils";
import { isPartitionBusy } from "../lib/busyPartitions";
import toast from "react-hot-toast";
import { storage } from "./storage";
import useFlashStore from "./useFlashStore";
import useSettingsStore from "./useSettingsStore";
import { withWhiskerChromeVersion } from "../lib/userAgent";

/** Number of webviews shown per page */
const getItemsPerPage = () => {
  const { columns, rows } = useSettingsStore.getState();
  return columns * rows;
};

/** The accounts with their User-Agents naming Whisker's Chrome version */
const withWhiskerUserAgents = (accounts) =>
  accounts.map((item) => ({
    ...item,
    userAgent: withWhiskerChromeVersion(item.userAgent),
  }));

/**
 * Sets `running` on the accounts in `partitions`, or on all with `null`.
 * Accounts a hidden webview is using are never opened.
 * Returns the same array when nothing changes.
 */
const setRunning = (accounts, partitions, running) => {
  let changed = false;

  const next = accounts.map((item) => {
    const matches = partitions === null || partitions.has(item.partition);

    if (!matches || Boolean(item.running) === running) return item;
    if (running && isPartitionBusy(item.partition)) return item;

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
        /**
         * Sets the titles of many accounts from `[partition, title]` pairs.
         * Returns how many accounts changed.
         */
        renameAccounts: (entries) => {
          const titles = new Map(entries);
          let changed = 0;

          const accounts = get().accounts.map((item) => {
            const title = titles.get(item.partition);

            if (title === undefined || title === item.title) return item;

            changed++;
            return { ...item, title };
          });

          if (changed > 0) set({ accounts });

          return changed;
        },

        /**
         * Adds and removes tags on the accounts in `partitions`.
         * Returns how many accounts changed.
         */
        updateAccountsTags: (partitions, add, remove) => {
          const targets = new Set(partitions);
          let changed = 0;

          const accounts = get().accounts.map((item) => {
            if (!targets.has(item.partition)) return item;

            const tags = applyTagChanges(item.tags, add, remove);

            if (tags === item.tags) return item;

            changed++;
            return { ...item, tags };
          });

          if (changed > 0) set({ accounts });

          return changed;
        },
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

        openAccounts: (partitions) =>
          set({ accounts: setRunning(get().accounts, partitions, true) }),

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
          if (isPartitionBusy(partition)) {
            toast.error("This account is busy with a background task.");
            return;
          }

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

          if (isPartitionBusy(account.partition)) {
            return { success: false, error: LAUNCH_ERROR.ACCOUNT_BUSY };
          }

          get().launchAccount(account.partition);

          return { success: true, partition: account.partition };
        },

        /** Tags */
        addTag: (tag) => set({ tags: [...get().tags, tag] }),
        removeTag: (id) => get().removeTags([id]),

        /**
         * Removes the tags with `ids` from the tag list and every account.
         * Returns how many accounts changed.
         */
        removeTags: (ids) => {
          const removed = new Set(ids);
          let changed = 0;

          const accounts = get().accounts.map((item) => {
            const tags = applyTagChanges(item.tags, [], ids);

            if (tags === item.tags) return item;

            changed++;
            return { ...item, tags };
          });

          set({
            tags: get().tags.filter((item) => !removed.has(item.id)),
            accounts,
          });

          return changed;
        },
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
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        accounts: withWhiskerUserAgents(
          persistedState?.accounts ?? currentState.accounts,
        ),
      }),
    },
  ),
);

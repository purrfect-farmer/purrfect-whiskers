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
  /** Whether any account changed */
  let changed = false;

  const next = accounts.map((item) => {
    /** Whether the account is targeted */
    const matches = partitions === null || partitions.has(item.partition);

    if (!matches || Boolean(item.running) === running) return item;
    if (running && isPartitionBusy(item.partition)) return item;

    changed = true;
    return { ...item, running };
  });

  return changed ? next : accounts;
};

/** The store of accounts, tags and proxies */
export default create(
  persist(
    combine(
      {
        /** The current page of running accounts */
        page: 0,
        /** The saved accounts */
        accounts: [],
        /** The saved tags */
        tags: [],
        /** The Spider API key */
        spiderApiKey: null,
        /** The chosen proxy provider */
        proxyProvider: PROXY_PROVIDER.WEBSHARE,
        /** The API key of the proxy provider */
        proxyApiKey: null,
        /** The fetched proxies */
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

          /** The position of each partition */
          const indexes = new Map(
            partitions.map((partition, index) => [partition, index]),
          );

          set({
            accounts: get().accounts.map((item) => {
              if (!indexes.has(item.partition)) return item;

              /** The proxy of the account */
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

        /** Adds an account */
        addAccount: (data) => set({ accounts: [...get().accounts, data] }),
        /** Adds the imported accounts not listed yet */
        importAccounts: (data) => {
          const existing = get().accounts;
          /** The listed partitions */
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
          /** The current index of the account */
          const fromIndex = accounts.findIndex(
            (item) => item.partition === partition,
          );

          if (fromIndex < 0) return;

          /** The clamped target index */
          const target = Math.max(0, Math.min(toIndex, accounts.length - 1));

          if (target === fromIndex) return;

          const next = [...accounts];
          const [moved] = next.splice(fromIndex, 1);

          next.splice(target, 0, moved);

          return set({ accounts: next });
        },
        /** Merges changes into an account */
        updateAccount: (data) =>
          set({
            accounts: get().accounts.map((item) =>
              item.partition === data.partition ? { ...item, ...data } : item,
            ),
          }),
        /** Renames many accounts, returning how many changed */
        renameAccounts: (entries) => {
          /** The new title of each partition */
          const titles = new Map(entries);
          /** The number of renamed accounts */
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

        /** Adds and removes tags on many accounts, returning how many changed */
        updateAccountsTags: (partitions, add, remove) => {
          /** The partitions to update */
          const targets = new Set(partitions);
          /** The number of changed accounts */
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
        /** Removes an account */
        removeAccount: (partition) =>
          set({
            accounts: get().accounts.filter(
              (item) => item.partition !== partition,
            ),
          }),

        /** Removes the accounts in `partitions` */
        removeAccounts: (partitions) => {
          /** The partitions to remove */
          const removed = new Set(partitions);

          set({
            accounts: get().accounts.filter(
              (item) => !removed.has(item.partition),
            ),
          });
        },

        /** Closes an account */
        closeAccount: (partition) =>
          set({
            accounts: setRunning(get().accounts, new Set([partition]), false),
          }),

        /** Closes the accounts in `partitions` */
        closeAccounts: (partitions) =>
          set({
            accounts: setRunning(get().accounts, new Set(partitions), false),
          }),

        /** Opens the accounts of a set of partitions */
        openAccounts: (partitions) =>
          set({ accounts: setRunning(get().accounts, partitions, true) }),

        /** Closes every account */
        closeAllAccounts: () =>
          set({ accounts: setRunning(get().accounts, null, false) }),

        /** Closes the running accounts of a page */
        closePage: (pageIndex) => {
          const { accounts } = get();
          const itemsPerPage = getItemsPerPage();

          /** The partitions of the page's running accounts */
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

          /** The accounts with this one running */
          const accounts = setRunning(
            get().accounts,
            new Set([partition]),
            true,
          );

          /** The index of the account among the running ones */
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

        /**
         * Opens many accounts and shows the first one,
         * returning how many were busy
         */
        launchAccounts: (partitions) => {
          /** The partitions to open */
          const targets = new Set(partitions);
          /** The partitions that are already open */
          const openPartitions = new Set(
            get()
              .accounts.filter((item) => item.running)
              .map((item) => item.partition),
          );
          /** The number of accounts left closed because they are busy */
          const busyCount = partitions.filter(
            (partition) =>
              isPartitionBusy(partition) && !openPartitions.has(partition),
          ).length;

          const accounts = setRunning(get().accounts, targets, true);
          /** The running accounts */
          const running = accounts.filter((item) => item.running);
          /** The index of the first opened account */
          const index = running.findIndex((item) =>
            targets.has(item.partition),
          );

          if (index >= 0) {
            set({
              accounts,
              page: Math.floor(index / getItemsPerPage()),
            });

            useFlashStore.getState().flash(running[index].partition);
          }

          return busyCount;
        },

        /** Launch an account by partition or telegram user id */
        launchAccountByRequest: (request) => {
          const { partition, telegramUserId } = request || {};
          const { accounts } = get();

          /** The requested Telegram user id */
          const userId = String(telegramUserId ?? "").trim();

          if (!partition && !userId) {
            return { success: false, error: LAUNCH_ERROR.INVALID_REQUEST };
          }

          /** The requested account */
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
        /** Adds a tag */
        addTag: (tag) => set({ tags: [...get().tags, tag] }),
        /** Removes a tag from the list and every account */
        removeTag: (id) => get().removeTags([id]),

        /**
         * Removes tags from the tag list and every account,
         * returning how many accounts changed
         */
        removeTags: (ids) => {
          /** The ids to remove */
          const removed = new Set(ids);
          /** The number of changed accounts */
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
        /** Renames a tag */
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
      /** Restores the saved state with up-to-date User-Agents */
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

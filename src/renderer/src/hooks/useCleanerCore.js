import { useCallback, useMemo, useState } from "react";
import {
  getCleanOutcome,
  summarizeClean,
  withEntries,
  withValues,
  withoutKeys,
} from "../lib/cleaner";

import { BROKEN_SESSION_STATUSES } from "../lib/sessionStatus";
import { SESSION_STATUS } from "../../../shared/constants/sessionStatus";
import { deleteAccounts } from "../lib/accounts";
import { getAccountSessionStatus } from "../lib/accountSession";
import { holdPartitions, isPartitionBusy } from "../lib/busyPartitions";
import { saveJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import useAccountsSelector from "./useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "./useBatchRunner";

/** The batch the cleaner is running */
export const CLEANER_TASK = Object.freeze({
  SCAN: "scan",
  CLEAN: "clean",
});

const toPartitions = (accounts) => accounts.map((item) => item.partition);

/**
 * Scans every account's Telegram session, lists the ones that are not
 * active and removes the selected ones after backing them up.
 * `onLaunch` runs after an account is launched from the list.
 */
export default function useCleanerCore({ onLaunch }) {
  const accounts = useAppStore((state) => state.accounts);
  const { target, progress, run } = useBatchRunner();

  const [task, setTask] = useState(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [results, setResults] = useState(() => new Map());

  /** Accounts removed elsewhere drop out of the list */
  const listedAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const status = results.get(account.partition);

        return status && status !== SESSION_STATUS.ACTIVE;
      }),
    [accounts, results],
  );

  const selector = useAccountsSelector(listedAccounts);
  const { selectedAccounts, setSelected } = selector;

  /** Runs one task at a time, behind a toast */
  const runTask = useCallback((name, job, messages) => {
    setTask(name);

    return toast
      .promise(job(), messages)
      .catch((error) => console.error(error))
      .finally(() => setTask(null));
  }, []);

  /** Apply a chunk of scan results in one update */
  const applyStatuses = useCallback(
    (entries) => {
      const broken = entries
        .filter(([, status]) => BROKEN_SESSION_STATUSES.has(status))
        .map(([partition]) => partition);

      setResults((prev) => withEntries(prev, entries));
      setSelected((prev) => withValues(prev, broken));
    },
    [setSelected],
  );

  const scan = useCallback(() => {
    const scanAccounts = async () => {
      const { accounts, closeAllAccounts } = useAppStore.getState();

      closeAllAccounts();
      setResults(new Map());
      setSelected(new Set());

      await run(
        accounts,
        async (account) => [
          account.partition,
          await getAccountSessionStatus(account),
        ],
        {
          partitions: toPartitions(accounts),
          onChunk: applyStatuses,
        },
      );

      setHasScanned(true);
    };

    return runTask(CLEANER_TASK.SCAN, scanAccounts, {
      loading: "Scanning accounts...",
      error: "Failed to scan accounts!",
      success: "Accounts were scanned!",
    });
  }, [run, runTask, setSelected, applyStatuses]);

  const clean = useCallback(() => {
    const cleanAccounts = async () => {
      const partitions = toPartitions(selectedAccounts);

      /** Held until the removals finish, not just the backups */
      const release = holdPartitions(partitions);

      try {
        useAppStore.getState().closeAllAccounts();

        const outcomes = await run(selectedAccounts, getCleanOutcome, {});

        const backedUp = outcomes.filter((item) => item.backup);
        const activeEntries = outcomes
          .filter((item) => item.status === SESSION_STATUS.ACTIVE)
          .map((item) => [item.account.partition, SESSION_STATUS.ACTIVE]);

        /** Nothing is removed unless its backup was saved */
        if (backedUp.length > 0) {
          await saveJsonFile("purrfect-whiskers-cleaner-backup", {
            accounts: backedUp.map(({ account, backup }) => ({
              account,
              backup,
            })),
          });
        }

        const removed = await deleteAccounts(
          backedUp.map((item) => item.account.partition),
        );

        setResults((prev) =>
          withEntries(withoutKeys(prev, removed), activeEntries),
        );

        const summary = summarizeClean(outcomes, removed);

        if (removed.length === 0 && activeEntries.length < outcomes.length) {
          throw new Error(summary);
        }

        return summary;
      } finally {
        release();
      }
    };

    return runTask(CLEANER_TASK.CLEAN, cleanAccounts, {
      loading: "Backing up and removing accounts...",
      error: (error) => error.message || "Failed to clean accounts!",
      success: (summary) => summary,
    });
  }, [run, runTask, selectedAccounts]);

  /** Show the account, closing the dialog unless it could not open */
  const launchAccount = useCallback(
    (partition) => {
      const busy = isPartitionBusy(partition);

      useAppStore.getState().launchAccount(partition);

      if (!busy) {
        onLaunch?.();
      }
    },
    [onLaunch],
  );

  return useMemo(
    () => ({
      task,
      target,
      progress,
      results,
      hasScanned,
      selector,
      scan,
      clean,
      launchAccount,
    }),
    [
      task,
      target,
      progress,
      results,
      hasScanned,
      selector,
      scan,
      clean,
      launchAccount,
    ],
  );
}

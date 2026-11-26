import { useCallback, useMemo, useState } from "react";
import {
  getCleanOutcome,
  getRemoveOutcome,
  isRemovable,
  summarizeClean,
  withEntries,
  withValues,
  withoutKeys,
} from "../lib/cleaner";

import { BROKEN_SESSION_STATUSES } from "../lib/sessionStatus";
import { CLEANER_SCREEN } from "../lib/constants";
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

/** The accounts to scan start unselected */
const SCAN_OPTIONS = { initiallySelected: false };

/** Maps accounts to their partitions */
const toPartitions = (accounts) => accounts.map((item) => item.partition);

/**
 * A hook for scanning sessions and removing the inactive accounts.
 * `onLaunch` runs after an account is launched from the list.
 */
export default function useCleanerCore({ onLaunch }) {
  /** The list of accounts */
  const accounts = useAppStore((state) => state.accounts);
  /** The progress and runner of the batches */
  const { target, progress, run } = useBatchRunner();

  /** The screen of the Accounts tab */
  const [screen, setScreen] = useState(CLEANER_SCREEN.PICK);
  /** The task being run */
  const [task, setTask] = useState(null);
  /** Whether the accounts have been scanned */
  const [hasScanned, setHasScanned] = useState(false);
  /** Whether cleaning backs the accounts up before removing them */
  const [withBackup, setWithBackup] = useState(true);
  /** The session status of each scanned partition */
  const [results, setResults] = useState(() => new Map());

  /** The scanned accounts without an active session */
  const listedAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const status = results.get(account.partition);

        return status && status !== SESSION_STATUS.ACTIVE;
      }),
    [accounts, results],
  );

  /** The selection of the accounts to scan */
  const scanSelector = useAccountsSelector(accounts, SCAN_OPTIONS);
  const { selectedAccounts: scanAccounts } = scanSelector;

  /** The selection of the listed accounts to remove */
  const removeSelector = useAccountsSelector(listedAccounts);
  const { selectedAccounts, setSelected } = removeSelector;

  /** The run of a task behind a toast */
  const runTask = useCallback((name, job, messages) => {
    setTask(name);

    return toast
      .promise(job(), messages)
      .catch((error) => console.error(error))
      .finally(() => setTask(null));
  }, []);

  /** The update with a chunk of scan results */
  const applyStatuses = useCallback(
    (entries) => {
      /** The partitions with a broken session */
      const broken = entries
        .filter(([, status]) => BROKEN_SESSION_STATUSES.has(status))
        .map(([partition]) => partition);

      setResults((prev) => withEntries(prev, entries));
      setSelected((prev) => withValues(prev, broken));
    },
    [setSelected],
  );

  /** The scan of the picked accounts' sessions */
  const scan = useCallback(() => {
    /** The scan job */
    const scanPicked = async () => {
      /** Show the results while they arrive */
      setScreen(CLEANER_SCREEN.RESULTS);

      /** Close the accounts and reset the last scan */
      useAppStore.getState().closeAllAccounts();
      setResults(new Map());
      setSelected(new Set());

      /** Check each picked account's session */
      await run(
        scanAccounts,
        async (account) => [
          account.partition,
          await getAccountSessionStatus(account),
        ],
        {
          partitions: toPartitions(scanAccounts),
          onBatch: applyStatuses,
        },
      );

      setHasScanned(true);
    };

    return runTask(CLEANER_TASK.SCAN, scanPicked, {
      loading: "Scanning accounts...",
      error: "Failed to scan accounts!",
      success: "Accounts were scanned!",
    });
  }, [run, runTask, scanAccounts, setSelected, applyStatuses]);

  /** The backup and removal of the selected accounts */
  const clean = useCallback(() => {
    /** The clean job */
    const cleanAccounts = async () => {
      /** The partitions being cleaned */
      const partitions = toPartitions(selectedAccounts);

      /** The release of the held partitions */
      const release = holdPartitions(partitions);

      try {
        useAppStore.getState().closeAllAccounts();

        /** The outcome of each account */
        const outcomes = await run(
          selectedAccounts,
          withBackup ? getCleanOutcome : getRemoveOutcome,
          {},
        );

        /** The outcomes that may be removed */
        const removable = outcomes.filter((item) =>
          isRemovable(item, withBackup),
        );
        /** The outcomes with a saved backup */
        const backedUp = outcomes.filter((item) => item.backup);
        /** The status entries of the accounts still active */
        const activeEntries = outcomes
          .filter((item) => item.status === SESSION_STATUS.ACTIVE)
          .map((item) => [item.account.partition, SESSION_STATUS.ACTIVE]);

        /** The save of the backups */
        if (backedUp.length > 0) {
          await saveJsonFile("purrfect-whiskers-cleaner-backup", {
            accounts: backedUp.map(({ account, backup }) => ({
              account,
              backup,
            })),
          });
        }

        /** The partitions removed */
        const removed = await deleteAccounts(
          removable.map((item) => item.account.partition),
        );

        setResults((prev) =>
          withEntries(withoutKeys(prev, removed), activeEntries),
        );

        /** The summary of the clean */
        const summary = summarizeClean(outcomes, removed, withBackup);

        if (removed.length === 0 && activeEntries.length < outcomes.length) {
          throw new Error(summary);
        }

        return summary;
      } finally {
        release();
      }
    };

    return runTask(CLEANER_TASK.CLEAN, cleanAccounts, {
      loading: withBackup
        ? "Backing up and removing accounts..."
        : "Checking and removing accounts...",
      error: (error) => error.message || "Failed to clean accounts!",
      success: (summary) => summary,
    });
  }, [run, runTask, selectedAccounts, withBackup]);

  /** The launch of an account, closing the dialog unless it is busy */
  const launchAccount = useCallback(
    (partition) => {
      /** Whether the account is busy */
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
      screen,
      setScreen,
      task,
      target,
      progress,
      results,
      hasScanned,
      scanSelector,
      removeSelector,
      withBackup,
      setWithBackup,
      scan,
      clean,
      launchAccount,
    }),
    [
      screen,
      withBackup,
      task,
      target,
      progress,
      results,
      hasScanned,
      scanSelector,
      removeSelector,
      scan,
      clean,
      launchAccount,
    ],
  );
}

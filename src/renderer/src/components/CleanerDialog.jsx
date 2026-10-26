import { CLEANER_TASK } from "../hooks/useCleanerCore";
import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { CLEANER_TAB } from "../lib/constants";
import CleanerAccountItem from "./CleanerAccountItem";
import CleanerTagsTab from "./CleanerTagsTab";
import LabelToggle from "./LabelToggle";
import { LuEraser } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Tabs from "./Tabs";
import { useCleaner } from "./CleanerProvider";
import { useCallback } from "react";
import useTabs from "../hooks/useTabs";

/** Progress label for each task */
const TASK_LABELS = {
  [CLEANER_TASK.SCAN]: "Checking sessions...",
  [CLEANER_TASK.CLEAN]: "Checking and removing accounts...",
};

/** Progress label of a clean that backs up first */
const BACKUP_CLEAN_LABEL = "Backing up accounts...";

/** A dialog for removing signed-out accounts and stale tags */
export default function CleanerDialog() {
  const {
    task,
    target,
    progress,
    results,
    hasScanned,
    selector,
    withBackup,
    setWithBackup,
    scan,
    clean,
    launchAccount,
  } = useCleaner();

  /** The progress label of the running task */
  const taskLabel =
    task === CLEANER_TASK.CLEAN && withBackup
      ? BACKUP_CLEAN_LABEL
      : TASK_LABELS[task];

  /** The label of the clean button */
  const cleanLabel = withBackup ? "Back up and Remove" : "Remove";

  /** The handler for the backup toggle */
  const toggleBackup = useCallback(
    (event) => setWithBackup(event.target.checked),
    [setWithBackup],
  );

  /** The accounts and tags tabs */
  const tabs = useTabs(Object.values(CLEANER_TAB), CLEANER_TAB.ACCOUNTS);
  /** Whether a scan or clean is running */
  const isProcessing = task !== null;
  const { accounts: listedAccounts, selectedAccounts } = selector;

  /** The status and launch props of an account row */
  const getItemProps = useCallback(
    (account) => ({
      status: results.get(account.partition),
      onLaunch: launchAccount,
    }),
    [results, launchAccount],
  );

  return (
    <AppDialogContent
      title={"Cleaner"}
      description={"Remove signed-out accounts and stale tags"}
      icon={LuEraser}
    >
      <Tabs tabs={tabs} disabled={isProcessing}>
        {/* Accounts */}
        <Tabs.Content
          value={CLEANER_TAB.ACCOUNTS}
          className="flex flex-col gap-2"
        >
          <Alert variant={"warning"} className="text-center">
            Every account is opened without its proxy to check its Telegram
            session. Cleaning checks the selected accounts again and keeps any
            that are signed in.
          </Alert>

          <PrimaryButton
            variant={hasScanned ? "neutral" : "solid"}
            disabled={isProcessing}
            onClick={scan}
          >
            {hasScanned ? "Scan Again" : "Scan Accounts"}
          </PrimaryButton>

          {isProcessing ? (
            <>
              <p className="text-center">{taskLabel}</p>
              <Progress current={progress} max={target} />
            </>
          ) : null}

          {listedAccounts.length > 0 ? (
            <>
              <AccountsPicker
                {...selector}
                itemComponent={CleanerAccountItem}
                getItemProps={getItemProps}
                disabled={isProcessing}
                autoFocusSearch={false}
              />

              <LabelToggle
                checked={withBackup}
                disabled={isProcessing}
                onChange={toggleBackup}
              >
                Back up first
              </LabelToggle>

              <PrimaryButton
                variant={withBackup ? "solid" : "danger"}
                disabled={isProcessing || selectedAccounts.length === 0}
                onClick={clean}
              >
                {cleanLabel} ({selectedAccounts.length})
              </PrimaryButton>
            </>
          ) : hasScanned && !isProcessing ? (
            <p className="text-center text-neutral-500 dark:text-neutral-400">
              Every account is signed in.
            </p>
          ) : null}
        </Tabs.Content>

        {/* Tags */}
        <Tabs.Content value={CLEANER_TAB.TAGS} className="flex flex-col gap-2">
          <CleanerTagsTab />
        </Tabs.Content>
      </Tabs>
    </AppDialogContent>
  );
}

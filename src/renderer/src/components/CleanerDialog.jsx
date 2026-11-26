import { CLEANER_TASK } from "../hooks/useCleanerCore";
import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import BackLink from "./BackLink";
import { ALERT_VARIANT, CLEANER_SCREEN, CLEANER_TAB } from "../lib/constants";
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
  const { accounts: listedAccounts, selectedAccounts } = removeSelector;
  /** The number of accounts picked for a scan */
  const scanCount = scanSelector.selectedAccounts.length;

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
          {/* Accounts to scan */}
          {screen === CLEANER_SCREEN.PICK ? (
            <>
              <Alert variant={ALERT_VARIANT.WARNING} className="text-center">
                Each picked account is opened without its proxy to check its
                Telegram session. Cleaning checks the selected accounts again
                and keeps any that are signed in.
              </Alert>

              <AccountsPicker
                {...scanSelector}
                title="Accounts to scan"
                disabled={isProcessing}
                autoFocusSearch={false}
              />

              <PrimaryButton
                disabled={isProcessing || scanCount === 0}
                onClick={scan}
              >
                Scan ({scanCount})
              </PrimaryButton>
            </>
          ) : null}

          {/* Scan results */}
          {screen === CLEANER_SCREEN.RESULTS ? (
            <>
              <BackLink
                onClick={() => setScreen(CLEANER_SCREEN.PICK)}
                disabled={isProcessing}
              >
                Accounts to scan
              </BackLink>

              <PrimaryButton
                variant="neutral"
                disabled={isProcessing || scanCount === 0}
                onClick={scan}
              >
                Scan Again ({scanCount})
              </PrimaryButton>

              {/* Progress */}
              {isProcessing ? (
                <>
                  <p className="text-center">{taskLabel}</p>
                  <Progress current={progress} max={target} />
                </>
              ) : null}

              {/* Signed-out accounts and removal */}
              {listedAccounts.length > 0 ? (
                <>
                  <AccountsPicker
                    {...removeSelector}
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
                  Every scanned account is signed in.
                </p>
              ) : null}
            </>
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

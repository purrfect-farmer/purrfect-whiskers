import { CLEANER_TASK } from "../hooks/useCleanerCore";
import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { CLEANER_TAB } from "../lib/constants";
import CleanerAccountItem from "./CleanerAccountItem";
import CleanerTagsTab from "./CleanerTagsTab";
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
  [CLEANER_TASK.CLEAN]: "Backing up accounts...",
};

export default function CleanerDialog() {
  const {
    task,
    target,
    progress,
    results,
    hasScanned,
    selector,
    scan,
    clean,
    launchAccount,
  } = useCleaner();

  const tabs = useTabs(Object.values(CLEANER_TAB), CLEANER_TAB.ACCOUNTS);
  const isProcessing = task !== null;
  const { accounts: listedAccounts, selectedAccounts } = selector;

  /** Each row only re-renders when its own status changes */
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
            session. Cleaning backs up the selected accounts before removing
            them.
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
              <p className="text-center">{TASK_LABELS[task]}</p>
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
              />

              <PrimaryButton
                disabled={isProcessing || selectedAccounts.length === 0}
                onClick={clean}
              >
                Back up and Remove ({selectedAccounts.length})
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

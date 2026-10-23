import { readJsonFile, saveJsonFile } from "../lib/utils";

import AccountsPicker from "./AccountsPicker";
import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import Dropzone from "./Dropzone";
import { LuUsers } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Tabs from "./Tabs";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import toast from "react-hot-toast";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "../hooks/useBatchRunner";
import { useCallback } from "react";
import useTabs from "../hooks/useTabs";

const JSON_FILES = { "application/json": [".json"] };

export default function ImportAndExportAccountsDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const { isProcessing, target, progress, run } = useBatchRunner();

  /** Tabs */
  const tabs = useTabs(["export", "import"], "export");

  /** Selector */
  const selector = useAccountsSelector(accounts);
  const { selectedAccounts } = selector;

  /** Export accounts */
  const exportAccounts = useCallback(() => {
    const exportData = async () => {
      useAppStore.getState().closeAllAccounts();

      const backups = await run(selectedAccounts, async (account) => ({
        account,
        backup: await getOrRestoreAccountBackup(account),
      }));

      await saveJsonFile("purrfect-whiskers-accounts-export", {
        accounts: backups,
      });
    };

    toast
      .promise(exportData(), {
        loading: "Exporting Accounts...",
        error: "Failed to Export Accounts!",
        success: "Accounts were successfully exported!",
      })
      .catch((e) => {
        console.error(e);
      });
  }, [run, selectedAccounts]);

  /** Restores each exported account's data, then adds the accounts */
  const importAccountsBackup = useCallback(
    async (data) => {
      const { closeAllAccounts, importAccounts } = useAppStore.getState();

      closeAllAccounts();

      await run(data.accounts, ({ account, backup }) =>
        getOrRestoreAccountBackup(account, backup),
      );

      importAccounts(data.accounts.map((item) => item.account));
    },
    [run],
  );

  /** On backup file drop */
  const onDrop = useCallback(
    ([file]) => {
      if (!file) return;

      readJsonFile(file).then(
        (data) =>
          toast
            .promise(importAccountsBackup(data), {
              loading: "Importing accounts...",
              error: "Failed to Import Accounts!",
              success: "Accounts were successfully imported!",
            })
            .catch((e) => {
              console.error(e);
            }),
        () => toast.error("Invalid JSON file!"),
      );
    },
    [importAccountsBackup],
  );

  return (
    <AppDialogContent
      title={"Import and Export"}
      description={"Export or Import accounts"}
      icon={LuUsers}
    >
      <Tabs tabs={tabs}>
        {/* Export */}
        <Tabs.Content value="export" className="flex flex-col gap-2">
          <AccountsPicker {...selector} disabled={isProcessing} />

          <PrimaryButton
            disabled={isProcessing || selectedAccounts.length === 0}
            onClick={exportAccounts}
          >
            Export
          </PrimaryButton>
        </Tabs.Content>

        {/* Import */}
        <Tabs.Content value="import" className="flex flex-col gap-2">
          <Alert variant={"warning"} className="text-center">
            You are about to import new accounts into the application.
          </Alert>

          <Dropzone
            accept={JSON_FILES}
            onDrop={onDrop}
            disabled={isProcessing}
            fileLabel="backup file"
          />
        </Tabs.Content>
      </Tabs>

      {isProcessing ? <Progress current={progress} max={target} /> : null}
    </AppDialogContent>
  );
}

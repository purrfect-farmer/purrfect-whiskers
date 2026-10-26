import AccountsImportForm from "./AccountsImportForm";
import AccountsPicker from "./AccountsPicker";
import AppDialogContent from "./AppDialogContent";
import { LuUsers } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Tabs from "./Tabs";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import { saveJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import useAccountsImportForm from "../hooks/useAccountsImportForm";
import useAccountsSelector from "../hooks/useAccountsSelector";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "../hooks/useBatchRunner";
import { useCallback } from "react";
import useTabs from "../hooks/useTabs";
import { withoutTags } from "../lib/accountsFile";

/** A dialog for exporting and importing accounts */
export default function ImportAndExportAccountsDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const { isProcessing, target, progress, run } = useBatchRunner();

  /** The import form, kept while the dialog is closed */
  const importForm = useAccountsImportForm(run);

  /** The export and import tabs */
  const tabs = useTabs(["export", "import"], "export");

  /** The selection of accounts to export */
  const selector = useAccountsSelector(accounts);
  const { selectedAccounts } = selector;

  /** The handler for exporting the selected accounts */
  const exportAccounts = useCallback(() => {
    /** The task that backs up and saves the selected accounts */
    const exportData = async () => {
      useAppStore.getState().closeAllAccounts();

      const backups = await run(
        selectedAccounts,
        async (account) => ({
          account: withoutTags(account),
          backup: await getOrRestoreAccountBackup(account),
        }),
        { partitions: selectedAccounts.map((account) => account.partition) },
      );

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
          <AccountsImportForm
            methods={importForm.methods}
            onSubmit={importForm.onSubmit}
            pickFile={importForm.pickFile}
            selector={importForm.selector}
            skippedCount={importForm.skippedCount}
            isProcessing={isProcessing}
          />
        </Tabs.Content>
      </Tabs>

      {isProcessing ? <Progress current={progress} max={target} /> : null}
    </AppDialogContent>
  );
}

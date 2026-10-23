import { readJsonFile, saveJsonFile } from "../lib/utils";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import Dropzone from "./Dropzone";
import { LuDatabaseBackup } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { Progress } from "./Progress";
import Tabs from "./Tabs";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import useBatchRunner from "../hooks/useBatchRunner";
import { useCallback } from "react";
import useSettingsStore from "../store/useSettingsStore";
import useTabs from "../hooks/useTabs";

const JSON_FILES = { "application/json": [".json"] };

export default function BackupAndRestoreDialog() {
  const { isProcessing, target, progress, run } = useBatchRunner();

  /** Collects every account's backup with the app and settings state */
  const getBackupData = useCallback(async () => {
    const { accounts, closeAllAccounts } = useAppStore.getState();

    closeAllAccounts();

    const backups = await run(accounts, async (account) => ({
      partition: account.partition,
      backup: await getOrRestoreAccountBackup(account),
    }));

    return {
      app: useAppStore.getState(),
      settings: useSettingsStore.getState(),
      backups,
    };
  }, [run]);

  /** Backup All Data */
  const backupData = useCallback(() => {
    toast
      .promise(
        getBackupData().then((data) =>
          saveJsonFile("purrfect-whiskers-backup", data),
        ),
        {
          loading: "Creating Backup...",
          error: "Failed to Create Backup!",
          success: "Backup was successfully created!",
        },
      )
      .catch((e) => {
        console.error(e);
      });
  }, [getBackupData]);

  /** Restores every account's data, then the app and settings state */
  const restoreBackup = useCallback(
    async ({ app, settings, backups }) => {
      useAppStore.getState().closeAllAccounts();

      const accounts = new Map(
        app.accounts.map((account) => [account.partition, account]),
      );

      const restorable = backups.filter((item) => accounts.has(item.partition));

      await run(restorable, (item) =>
        getOrRestoreAccountBackup(accounts.get(item.partition), item.backup),
      );

      /** Keep this device's extension path */
      const { extensionPath } = useSettingsStore.getState();

      useAppStore.setState(app);
      useSettingsStore.setState({ ...settings, extensionPath });
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
            .promise(restoreBackup(data), {
              loading: "Restoring Backup...",
              error: "Failed to Restore Backup!",
              success: "Backup was successfully restored!",
            })
            .catch((e) => {
              console.error(e);
            }),
        () => toast.error("Invalid JSON file!"),
      );
    },
    [restoreBackup],
  );

  /** Tabs */
  const tabs = useTabs(["backup", "restore"], "backup");

  return (
    <AppDialogContent
      title={"Backup and Restore"}
      description={"Create or Restore Backup"}
      icon={LuDatabaseBackup}
    >
      <Tabs tabs={tabs}>
        {/* Backup */}
        <Tabs.Content value="backup" className="flex flex-col gap-2">
          <Alert variant={"warning"} className="text-center">
            You are about to backup all data of the application. This includes
            accounts and their Telegram Web data.
          </Alert>

          <PrimaryButton disabled={isProcessing} onClick={backupData}>
            Backup Now
          </PrimaryButton>
        </Tabs.Content>

        {/* Restore */}
        <Tabs.Content value="restore" className="flex flex-col gap-2">
          <Alert variant={"warning"} className="text-center">
            You are about to restore all data of the application. This includes
            accounts and their Telegram Web data.
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

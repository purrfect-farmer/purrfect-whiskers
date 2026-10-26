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

/** The file types the dropzone accepts */
const JSON_FILES = { "application/json": [".json"] };

/** A dialog for backing up and restoring all accounts */
export default function BackupAndRestoreDialog() {
  const { isProcessing, target, progress, run } = useBatchRunner();

  /** The callback that collects every account's backup and the app state */
  const getBackupData = useCallback(async () => {
    const { accounts, closeAllAccounts } = useAppStore.getState();

    closeAllAccounts();

    const backups = await run(
      accounts,
      async (account) => ({
        partition: account.partition,
        backup: await getOrRestoreAccountBackup(account),
      }),
      { partitions: accounts.map((account) => account.partition) },
    );

    return {
      app: useAppStore.getState(),
      settings: useSettingsStore.getState(),
      backups,
    };
  }, [run]);

  /** The handler for backing up all data */
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

  /** The callback that restores every account's data and the app state */
  const restoreBackup = useCallback(
    async ({ app, settings, backups }) => {
      useAppStore.getState().closeAllAccounts();

      /** The backed-up accounts by partition */
      const accounts = new Map(
        app.accounts.map((account) => [account.partition, account]),
      );

      /** The backups of accounts in the backed-up app state */
      const restorable = backups.filter((item) => accounts.has(item.partition));

      await run(
        restorable,
        (item) =>
          getOrRestoreAccountBackup(accounts.get(item.partition), item.backup),
        { partitions: restorable.map((item) => item.partition) },
      );

      /** This device's extension path */
      const { extensionPath } = useSettingsStore.getState();

      useAppStore.setState(app);
      useSettingsStore.setState({ ...settings, extensionPath });
    },
    [run],
  );

  /** The handler for a dropped backup file */
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

  /** The backup and restore tabs */
  const tabs = useTabs(["backup", "restore"], "backup");

  return (
    <AppDialogContent
      title={"Backup and Restore"}
      description={"Save everything to a file, or restore it"}
      icon={LuDatabaseBackup}
    >
      <Tabs tabs={tabs}>
        {/* Backup */}
        <Tabs.Content value="backup" className="flex flex-col gap-2">
          <Alert variant={"info"}>
            Saves every account with its Telegram Web data, plus your settings,
            to one file in the backup folder.
          </Alert>

          <PrimaryButton disabled={isProcessing} onClick={backupData}>
            Backup Now
          </PrimaryButton>
        </Tabs.Content>

        {/* Restore */}
        <Tabs.Content value="restore" className="flex flex-col gap-2">
          <Alert variant={"warning"}>
            Restoring replaces all your accounts and settings with the ones in
            the backup file.
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

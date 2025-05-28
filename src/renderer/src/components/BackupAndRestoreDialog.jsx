import toast from "react-hot-toast";
import { LuDatabaseBackup } from "react-icons/lu";
import { formatDate } from "date-fns";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import PrimaryButton from "./PrimaryButton";
import Tabs from "./Tabs";
import useAppStore from "../store/useAppStore";
import useSettingsStore from "../store/useSettingsStore";
import useTabs from "../hooks/useTabs";
import { chunkArrayGenerator, cn } from "../lib/utils";
import {
  configureProxy,
  createWebview,
  registerWebviewMessage,
} from "../lib/partitions";

export default function BackupAndRestoreDialog() {
  const containerRef = useRef();

  const accounts = useAppStore((state) => state.accounts);
  const theme = useSettingsStore((state) => state.theme);
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const setPartitions = useAppStore((state) => state.setPartitions);

  /** Save Backup File */
  const saveBackupFile = useCallback(
    (data) =>
      window.electron.ipcRenderer.invoke(
        "save-backup-file",
        `purrfect-whiskers-backup-${formatDate(new Date(), "yyyyMMdd-HHmmss")}.json`,
        JSON.stringify(data, null, 2)
      ),
    []
  );

  /** Get or Restore Account Backup */
  const getOrRestoreAccountBackup = useCallback(
    (account, backup = null) =>
      new Promise(async (resolve, reject) => {
        const {
          partition,
          proxyEnabled,
          proxyHost,
          proxyPort,
          proxyUsername,
          proxyPassword,
        } = account;

        /** Configure Proxy */
        await configureProxy(partition, {
          proxyEnabled,
          proxyHost,
          proxyPort,
          proxyUsername,
          proxyPassword,
        });

        const container = containerRef.current;
        const webview = createWebview(partition, extensionPath);

        /** Send Host Message */
        const sendHostMessage = (data) => {
          webview.send("host-message", data);
        };

        /** Handle Response */
        const handleResponse = (data) => {
          webview.remove();
          resolve(data);
        };

        /** Register Webview Message */
        registerWebviewMessage(webview, {
          "get-whisker-data": () => {
            /** Send Whisker Data */
            sendHostMessage({
              action: "set-whisker-data",
              data: {
                account,
                theme,
              },
            });

            if (backup) {
              /** Restore Backup Data */
              sendHostMessage({
                action: "restore-backup-data",
                data: backup,
              });
            } else {
              /** Request for Backup Data */
              sendHostMessage({
                action: "get-backup-data",
              });
            }
          },
          "set-proxy": (data) => {
            configureProxy(partition, data);
          },
          "response-get-backup-data": handleResponse,
          "response-restore-backup-data": handleResponse,
        });

        /** Append to container */
        container.appendChild(webview);
      }),
    [theme, extensionPath]
  );

  /** Get Backup Data */
  const getBackupData = useCallback(async () => {
    /** Close Opened Partitions */
    setPartitions([]);

    /** Create Backups Array */
    const backups = [];

    for (const chunk of chunkArrayGenerator(accounts, 2)) {
      await Promise.all(
        chunk.map(async (account) => {
          const result = await getOrRestoreAccountBackup(account);

          /** Add Backup */
          backups.push({
            partition: account.partition,
            backup: result,
          });
        })
      );
    }

    return {
      app: useAppStore.getState(),
      settings: useSettingsStore.getState(),
      backups,
    };
  }, [accounts, setPartitions, getOrRestoreAccountBackup]);

  /** Backup All Data */
  const backupData = useCallback(async () => {
    toast
      .promise(
        getBackupData().then((data) => {
          saveBackupFile(data);
        }),
        {
          loading: "Creating Backup...",
          error: "Failed to Create Backup!",
          success: "Backup was successfully created!",
        }
      )
      .catch((e) => {
        console.error(e);
      });
  }, [getBackupData, saveBackupFile]);

  /** Restore Backup */
  const restoreBackup = useCallback(
    async (data) => {
      /** Close Opened Partitions */
      setPartitions([]);

      /** Destructure Data */
      const { app, settings, backups } = data;

      for (const chunk of chunkArrayGenerator(backups, 2)) {
        await Promise.all(
          chunk.map(async (item) => {
            const account = app.accounts.find(
              (account) => account.partition === item.partition
            );
            await getOrRestoreAccountBackup(account, item.backup);
          })
        );
      }

      /** Restore States */
      useAppStore.setState(app);
      useSettingsStore.setState({ ...settings, extensionPath });
    },
    [extensionPath, setPartitions, getOrRestoreAccountBackup]
  );

  /** On backup file drop */
  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const data = JSON.parse(e.target.result);
          toast
            .promise(restoreBackup(data), {
              loading: "Restoring Backup...",
              error: "Failed to Restore Backup!",
              success: "Backup was successfully restored!",
            })
            .catch((e) => {
              console.error(e);
            });
        } catch (err) {
          toast.error("Invalid JSON file!");
        }
      });
      reader.readAsText(file);
    },
    [restoreBackup]
  );

  /** Dropzone */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

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

          <PrimaryButton onClick={backupData}>Backup Now</PrimaryButton>
        </Tabs.Content>

        {/* Restore */}
        <Tabs.Content value="restore" className="flex flex-col gap-2">
          <Alert variant={"warning"} className="text-center">
            You are about to restore all data of the application. This includes
            accounts and their Telegram Web data.
          </Alert>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border border-dashed border-orange-500",
              "px-4 py-10 text-center rounded-xl",
              "text-orange-500"
            )}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the backup file here ...</p>
            ) : (
              <p>
                Drag 'n' drop the backup file here, or click to select backup
                file
              </p>
            )}
          </div>
        </Tabs.Content>
      </Tabs>

      {/* Webview Containers */}
      <div ref={containerRef} className="hidden w-screen h-screen"></div>
    </AppDialogContent>
  );
}

import { HiOutlineArrowLeft, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { NumberInput } from "./NumberInput";
import { useCallback, useRef, useState } from "react";
import PrimaryButton from "./PrimaryButton";
import Input from "./Input";
import { useMutation } from "@tanstack/react-query";
import useAppStore from "../store/useAppStore";
import { createWebview } from "../lib/utils";
import Spider from "../lib/Spider";
import { uuid } from "../lib/utils";
import useSettingsStore from "../store/useSettingsStore";
import { getWhiskerData, registerWebviewMessage } from "../lib/partitions";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "./Progress";
import toast from "react-hot-toast";
import LabelToggle from "./LabelToggle";
import socket from "../lib/mirror";

export default function SpiderAccountsForm({ country, clearSelection }) {
  const containerRef = useRef();

  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const addAccount = useAppStore((state) => state.addAccount);
  const launchAccount = useAppStore((state) => state.launchAccount);

  const extensionPath = useSettingsStore((state) => state.extensionPath);

  const [numberOfAccounts, setNumberOfAccounts] = useState(1);
  const [password, setPassword] = useState("");
  const [enableLocalTelegramSession, setEnableLocalTelegramSession] =
    useState(true);

  const { progress, resetProgress, incrementProgress } = useProgress();

  /** Calculate Total Price */
  const totalPrice = (numberOfAccounts * country.price).toFixed(2);

  /** Restore account backup */
  const restoreAccountBackup = useCallback(
    (account, backup = null) =>
      new Promise(async (resolve, reject) => {
        const { partition } = account;

        let interval, webview;
        const container = containerRef.current;
        const initializeWebview = () => {
          webview?.remove();
          webview = createWebview(partition, extensionPath);

          /** Send Host Message */
          const sendHostMessage = (data) => {
            webview.send("host-message", data);
          };

          /** Handle Response */
          const handleResponse = (data) => {
            webview.remove();
            clearInterval(interval);
            resolve(data);
          };

          /** Register Webview Message */
          registerWebviewMessage(webview, {
            "get-whisker-data": () => {
              /** Send Whisker Data */
              sendHostMessage({
                action: "set-whisker-data",
                data: getWhiskerData({
                  account,
                  settings: {},
                }),
              });

              /** Restore Backup Data */
              sendHostMessage({
                action: "restore-backup-data",
                data: backup,
              });
            },

            "response-restore-backup-data": handleResponse,
          });

          /** Append to container */
          container.appendChild(webview);
        };

        /** Set Interval */
        interval = setInterval(initializeWebview, 30 * 1000);

        /** Initialize */
        initializeWebview();
      }),
    [extensionPath]
  );

  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country.code],
    mutationFn: async ({ count, twoFA, enableLocalTelegramSession }) => {
      resetProgress();

      const spider = new Spider(spiderApiKey);
      const results = [];

      console.log("Starting purchase of", count, "accounts");
      console.log("Using 2FA password:", twoFA);

      for (let i = 0; i < count; i++) {
        try {
          const purchase = await spider.purchaseAccount({
            countryCode: country.code,
            enableLocalTelegramSession,
            twoFA,
          });

          /* Validate Purchae */
          if (!purchase.success) {
            throw new Error(
              purchase.error || "Unknown error purchasing account"
            );
          }

          /* Log Purchase */
          console.log("Purchased account from Spider:", purchase);

          const { account, localTelegramSession, telegramWebLocalStorage } =
            purchase;

          /* Prepare New Whiskers Account */
          const partition = `persist:${uuid()}`;
          const newWhiskersAccount = {
            partition,
            title: `Spider ${account["phone"]}`,
          };

          /* Store Account */
          addAccount(newWhiskersAccount);

          /* Log Restoring Backup */
          console.log("Restoring backup for account:", newWhiskersAccount);

          try {
            /* Prepare Chrome Local Storage */
            const chromeLocalStorage = {
              "shared:accounts": [
                {
                  id: "default",
                  partition: partition,
                  title: newWhiskersAccount.title,
                },
              ],
            };

            /* Store Local Telegram Session if Enabled */
            if (enableLocalTelegramSession) {
              chromeLocalStorage["account-default:local-telegram-session"] =
                localTelegramSession;

              chromeLocalStorage["account-default:settings"] = {
                farmerMode: "session",
                onboarded: true,
              };
            }

            /* Prepare Backup Data */
            const backupData = {
              data: {
                telegramWebLocalStorage,
                chromeLocalStorage,
              },
            };

            /* Log Backup Data */
            console.log("Backup data to restore:", backupData);

            /* Restore Backup */
            await restoreAccountBackup(newWhiskersAccount, backupData);

            /* Launch Account */
            launchAccount(partition);

            /* Wait a moment to ensure data is written */
            await toast.promise(
              new Promise((res) => setTimeout(res, 2000)).then(() =>
                /* Set active tab to telegram-web-k */
                socket.send({
                  action: "core.set-active-tab",
                  data: ["telegram-web-k"],
                })
              ),
              {
                loading: "Finalizing account setup...",
                success: "Account setup finalized!",
                error: "Error finalizing account setup.",
              }
            );
          } catch (e) {
            console.error("Error restoring account backup:", e);
          }

          /* Push Result */
          results.push(purchase);
        } catch (error) {
          console.error("Error purchasing account:", error);
          results.push({ success: false, error: error.message });
        } finally {
          incrementProgress();
        }
      }

      return results;
    },
  });

  /** Purchase Accounts */
  const purchaseAccounts = async () => {
    /* Log Purchase Details */
    console.log(
      "Purchasing",
      numberOfAccounts,
      "accounts for country",
      country.code
    );

    /* Log 2FA Password */
    console.log("Using 2FA password:", password);

    /* Execute Mutation */
    const results = await mutation.mutateAsync({
      count: numberOfAccounts,
      twoFA: password,
      enableLocalTelegramSession,
    });

    /* Log Results */
    console.log("Purchase results:", results);

    /* Toast Completion */
    toast.success("Account purchase process completed.");
  };

  return (
    <>
      {/* Webview Containers */}
      <div ref={containerRef}></div>

      {/* Country Information */}
      <h2 className="text-lg flex justify-center items-center gap-2 text-orange-500 font-bold">
        <span>{country.emoji}</span>
        {country.name} ({country.code})
      </h2>

      {/* Country Price */}
      <div className="flex flex-col gap-1">
        <p className="text-center text-sky-500 dark:text-sky-300 font-bold">
          ${country.price} (Per Account)
        </p>

        <p className="text-center text-purple-500 dark:text-purple-300 font-bold">
          Total: ${totalPrice}
        </p>
      </div>

      {/* Return to Countries */}
      <button
        onClick={clearSelection}
        className="flex justify-center items-center gap-2 text-sm text-orange-500 hover:underline"
      >
        <HiOutlineArrowLeft className="size-4" /> Return to Countries
      </button>

      {/* Number of Accounts */}
      <NumberInput
        label="Number of Accounts"
        value={numberOfAccounts}
        onChange={setNumberOfAccounts}
        readOnly={false}
        disabled={mutation.isPending}
      />

      {/* Enable Local Telegram Session */}
      <LabelToggle
        onChange={(ev) => setEnableLocalTelegramSession(ev.target.checked)}
        checked={enableLocalTelegramSession}
        disabled={mutation.isPending}
      >
        Enable Local Telegram Session
      </LabelToggle>

      {/* 2FA */}
      <Input
        placeholder="2FA (Optional)"
        value={password}
        disabled={mutation.isPending}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* 2FA Information */}
      <p className="text-center text-neutral-500 dark:text-neutral-400 px-2">
        Leave empty if you do not want to change the 2FA password of the new
        accounts.
      </p>

      {/* Purchase Button */}
      <PrimaryButton onClick={purchaseAccounts} disabled={mutation.isPending}>
        <HiOutlineCurrencyDollar className="size-5" />
        {mutation.isPending ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>

      {/* Progress */}
      {mutation.isPending && (
        <Progress current={progress} max={numberOfAccounts} />
      )}
    </>
  );
}

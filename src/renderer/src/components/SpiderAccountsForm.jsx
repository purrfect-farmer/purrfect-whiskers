import { HiOutlineArrowLeft } from "react-icons/hi2";
import { NumberInput } from "./NumberInput";
import { useCallback, useRef, useState } from "react";
import PrimaryButton from "./PrimaryButton";
import Input from "./Input";
import { useMutation } from "@tanstack/react-query";
import useAppStore from "../store/useAppStore";
import { createWebview } from "../lib/utils";
import Spider from "../lib/Spider";
import { MemorySession, StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { uuid } from "../lib/utils";
import useSettingsStore from "../store/useSettingsStore";
import { getWhiskerData, registerWebviewMessage } from "../lib/partitions";
import { useProgress } from "../hooks/useProgress";
import { Progress } from "./Progress";
import { NewMessage, NewMessageEvent } from "telegram/events";

const createTelegramClient = (session) =>
  new TelegramClient(session, 2496, "8da85b0d5bfe62527e5b244c209159c3", {
    appVersion: "2.2 K",
    systemLangCode: "en-US",
    langCode: "en",
    deviceModel:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    systemVersion: "Linux x86_64",
  });

export default function SpiderAccountsForm({ country, clearSelection }) {
  const containerRef = useRef();

  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const addAccount = useAppStore((state) => state.addAccount);

  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const theme = useSettingsStore((state) => state.theme);
  const allowProxies = useSettingsStore((state) => state.allowProxies);

  const [numberOfAccounts, setNumberOfAccounts] = useState(1);
  const [password, setPassword] = useState("");

  const { progress, resetProgress, incrementProgress } = useProgress();

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
                  settings: {
                    allowProxies,
                    theme,
                  },
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
    [theme, allowProxies, extensionPath]
  );

  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country.code],
    mutationFn: async ({ count, twoFA }) => {
      resetProgress();

      const spider = new Spider(spiderApiKey);
      const results = [];

      console.log("Starting purchase of", count, "accounts");
      console.log("Using 2FA password:", twoFA);

      for (let i = 0; i < count; i++) {
        try {
          let authResult = null;
          let used2FA = false;
          const account = await spider.getNumber(country.code);

          if (!account?.["phone"]) {
            throw new Error(
              "No account returned from Spider for country " + country.code
            );
          }

          /* Log Acquired Account */
          console.log("Acquired account:", account);

          const telegram = await new Promise(async (resolve, reject) => {
            try {
              const session = new MemorySession();
              const client = createTelegramClient(session);

              /* Start Client and Authenticate */
              await client.start({
                phoneNumber: async () => account["phone"],
                phoneCode: async () => {
                  /* Get Code */
                  authResult = await spider.getCode(account["hash_code"]);

                  /* Log Received Auth Result */
                  console.log("Received auth result:", authResult);

                  /* Return Code */
                  return authResult["code"];
                },
                password: async () => {
                  /* Indicate 2FA Was Used */
                  used2FA = true;

                  /* Log Password Usage */
                  console.log(
                    "Using 2FA password from Spider:",
                    authResult["password"]
                  );

                  /* Return Password */
                  return authResult["password"];
                },
                onError: (err) => reject(err),
              });

              /* Extract Session Details */
              const authKey = client.session.authKey.getKey().toString("hex");
              const dcId = client.session.dcId;

              /* Log Successful Login */
              console.log("Successfully logged in to Telegram");

              console.log("Auth Key:", authKey);
              console.log("DC ID:", dcId);

              const user = await client.getMe();
              console.log("Logged in as", user.username || user.firstName);

              if (twoFA || used2FA) {
                await client.updateTwoFaSettings({
                  currentPassword: used2FA ? authResult["password"] : undefined,
                  newPassword: twoFA || undefined,
                  email: "",
                  hint: "",
                });
              }

              return resolve({
                account,
                authResult,
                used2FA,
                user,
                client,
                authKey,
                dcId,
              });
            } catch (error) {
              return reject(error);
            }
          });

          const localTelegram = await new Promise(async (resolve, reject) => {
            try {
              const session = new StringSession();
              const client = createTelegramClient(session);

              let authCodeMessage = null;

              /* Add New Message Handler to the SAME client before connecting */
              telegram.client.addEventHandler(
                /**
                 * @param {NewMessageEvent} event
                 */
                (event) => {
                  console.log("New message event received:", event.message);
                  const message = event.message?.message || "";
                  const match = message.match(/(\d{5})/);

                  if (match) {
                    authCodeMessage = match[1];
                    console.log("Extracted auth code:", authCodeMessage);
                  }
                },
                new NewMessage({
                  fromUsers: [777000] /* Telegram Service Notifications */,
                })
              );

              /* Request auth code via Telegram (this will trigger the message) */
              console.log("Requesting SMS code via Telegram...");

              /* Start Client and Authenticate */
              await client.start({
                phoneNumber: async () => account["phone"],
                phoneCode: async () => {
                  return new Promise((resolveCode, rejectCode) => {
                    /* Check if we already have the code */
                    if (authCodeMessage) {
                      return resolveCode(authCodeMessage);
                    }

                    /* Wait for the auth code message */
                    console.log(
                      "Waiting for auth code message from Telegram..."
                    );

                    let attempts = 0;
                    let interval = setInterval(() => {
                      attempts += 1;
                      if (authCodeMessage) {
                        clearInterval(interval);
                        return resolveCode(authCodeMessage);
                      }

                      if (attempts >= 10) {
                        clearInterval(interval);
                        return rejectCode(new Error("Auth code timeout"));
                      }
                    }, 5000);
                  });
                },
                password: async () => {
                  /* Indicate 2FA Was Used */
                  used2FA = true;

                  /* Log Password Usage */
                  console.log("Using 2FA password from Spider:", twoFA);

                  /* Return Password */
                  return twoFA;
                },
                onError: (err) => reject(err),
              });

              /* Destroy Client */
              try {
                await client.destroy();
              } catch (e) {
                console.error("Error destroying local client:", e);
              }

              return resolve({
                account,
                authResult,
                used2FA,
                session: client.session.save(),
              });
            } catch (error) {
              return reject(error);
            }
          });

          /* Destroy Main Client */
          try {
            await telegram.client.destroy();
          } catch (e) {
            console.error("Error destroying main client:", e);
          }

          /* Log Telegram Results */
          console.log("Telegram results:", telegram);

          /* Log Local Telegram Results */
          console.log("Local Telegram results:", localTelegram);

          /* Prepare New Whiskers Account */
          const partition = `persist:${uuid()}`;
          const newWhiskersAccount = {
            partition,
            title: `Spider ${account["phone"]}`,
          };

          /* Store Account and Partition */
          addAccount(newWhiskersAccount);

          /* Log Restoring Backup */
          console.log("Restoring backup for account:", newWhiskersAccount);

          try {
            /* Prepare Backup Data */
            const backupData = {
              data: {
                telegramWebLocalStorage: Object.fromEntries(
                  Object.entries({
                    ["account1"]: {
                      ["dcId"]: telegram.dcId,
                      [`dc${telegram.dcId}_auth_key`]: telegram.authKey,
                      ["dc2_auth_key"]: telegram.authKey /* Patch for Web-K */,
                      ["userId"]: telegram.user.id.toString(),
                      ["auth_key_fingerprint"]: telegram.authKey.slice(0, 8),
                    },
                  }).map(([key, value]) => [key, JSON.stringify(value)])
                ),
                chromeLocalStorage: {
                  "shared:accounts": [
                    {
                      id: "default",
                      partition: partition,
                      title: newWhiskersAccount.title,
                    },
                  ],
                  "account-default:local-telegram-session":
                    localTelegram.session,
                },
              },
            };

            /* Log Backup Data */
            console.log("Backup data to restore:", backupData);

            await restoreAccountBackup(newWhiskersAccount, backupData);
          } catch (e) {
            console.error("Error restoring account backup:", e);
          }

          results.push({
            success: true,
            phone: account["phone"],
            user: telegram.user,
            authKey: telegram.authKey,
            dcId: Number(telegram.dcId),
          });
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
    });

    /* Log Results */
    console.log("Purchase results:", results);
  };

  return (
    <>
      {/* Country Information */}
      <h2 className="text-lg flex justify-center items-center gap-2">
        <span>{country.emoji}</span>
        {country.name} ({country.code})
      </h2>

      {/* Country Price */}
      <p className="text-center text-lime-300 font-bold">
        ${country.price} per account
      </p>

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

      {/* 2FA */}
      <Input
        placeholder="2FA (Optional)"
        value={password}
        disabled={mutation.isPending}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* 2FA Information */}
      <p className="text-center text-neutral-300">
        Leave empty if you do not want to change the 2FA password of the
        accounts.
      </p>

      {/* Purchase Button */}
      <PrimaryButton onClick={purchaseAccounts} disabled={mutation.isPending}>
        {mutation.isPending ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>

      {/* Progress */}
      {mutation.isPending && (
        <Progress current={progress} max={numberOfAccounts} />
      )}

      {/* Webview Containers */}
      <div ref={containerRef}></div>
    </>
  );
}

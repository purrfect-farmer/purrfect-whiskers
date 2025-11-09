import { HiOutlineArrowLeft } from "react-icons/hi2";
import { NumberInput } from "./NumberInput";
import { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import Input from "./Input";
import { useMutation } from "@tanstack/react-query";
import useAppStore from "../store/useAppStore";
import { chunkArrayGenerator } from "../lib/utils";
import Spider from "../lib/Spider";
import { StringSession } from "telegram/sessions";
import { TelegramClient, Api } from "telegram";

export default function SpiderAccountsForm({ country, clearSelection }) {
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const [numberOfAccounts, setNumberOfAccounts] = useState(1);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country.code],
    mutationFn: async ({ count, twoFA }) => {
      const spider = new Spider(spiderApiKey);
      const results = [];

      console.log("Starting purchase of", count, "accounts");
      console.log("Using 2FA password:", twoFA);

      for (const chunk of chunkArrayGenerator(
        Array.from({ length: count }),
        3
      )) {
        const chunkResults = await Promise.all(
          chunk.map(async () => {
            try {
              let authResult = null;
              let used2FA = false;
              const account = await spider.getNumber(country.code);

              if (!account) {
                throw new Error(
                  "No account returned from Spider for country " + country.code
                );
              }

              /* Log Acquired Account */
              console.log("Acquired account:", account["phone"]);

              const telegram = await new Promise(async (resolve, reject) => {
                try {
                  const stringSession = new StringSession("");
                  const client = new TelegramClient(
                    stringSession,
                    2496,
                    "8da85b0d5bfe62527e5b244c209159c3",
                    {
                      appVersion: "2.2 K",
                      systemLangCode: "en-US",
                      langCode: "en",
                      deviceModel:
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
                      systemVersion: "Linux x86_64",
                    }
                  );

                  /* Start Client and Authenticate */
                  await client.start({
                    phoneNumber: async () => account["phone"],
                    phoneCode: async () =>
                      await spider
                        .getCode(account["hash_code"])
                        .then((result) => {
                          /* Store Auth Result for Later Use */
                          authResult = result;

                          /* Return Code */
                          return result["code"];
                        }),
                    password: async () => {
                      /* Indicate 2FA Was Used */
                      used2FA = true;

                      /* Log Password Usage */
                      console.log(
                        "Using 2FA password from Spider:",
                        authResult
                      );

                      /* Return Password */
                      return authResult["password"];
                    },
                    onError: (err) => reject(err),
                  });

                  const authKey = client.session.authKey
                    .getKey()
                    .toString("hex");
                  const dcId = client.session.dcId;

                  const user = await client.getMe();
                  console.log("Logged in as", user.username || user.firstName);

                  if (twoFA || used2FA) {
                    const authorized = await client.isUserAuthorized();
                    if (authorized) {
                      await client.invoke(
                        new Api.account.UpdatePasswordSettings({
                          password: used2FA
                            ? authResult["password"]
                            : new Api.InputCheckPasswordEmpty(),
                          newSettings: new Api.PasswordInputSettings({
                            newPassword: twoFA || undefined,
                            hint: "",
                            email: "",
                          }),
                        })
                      );
                    } else {
                      return reject(
                        new Error("Failed to authorize user for 2FA update")
                      );
                    }
                  }

                  return resolve({
                    authResult,
                    used2FA,
                    client,
                    user,
                    authKey,
                    dcId,
                  });
                } catch (error) {
                  return reject(error);
                }
              });

              return {
                success: true,
                phone: account["phone"],
                user: telegram.user,
                session: telegram.client.session.save(),
                authKey: telegram.authKey,
                dcId: telegram.dcId,
              };
            } catch (error) {
              console.error("Error purchasing account:", error);
              return { success: false, error: error.message };
            }
          })
        );

        results.push(...chunkResults);
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
      />

      {/* 2FA */}
      <Input
        placeholder="2FA (Optional)"
        value={password}
        onChange={setPassword}
      />

      {/* 2FA Information */}
      <p className="text-center text-neutral-300">
        Leave empty if you do not want to change the 2FA password of the
        accounts.
      </p>

      <PrimaryButton onClick={purchaseAccounts} disabled={mutation.isLoading}>
        {mutation.isLoading ? "Purchasing..." : "Purchase Accounts"}
      </PrimaryButton>
    </>
  );
}

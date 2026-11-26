import * as yup from "yup";

import { useCallback, useMemo, useState } from "react";

import TgGet from "../lib/TgGet";
import { getAccountSession } from "../lib/accountSessions";
import { hasTelegramUser, saveJsonFile } from "../lib/utils";
import { holdPartitions } from "../lib/busyPartitions";
import toast from "react-hot-toast";
import useAccountsSelector from "./useAccountsSelector";
import useAppStore from "../store/useAppStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** The others start unselected */
const OTHERS_OPTIONS = { initiallySelected: false };

/** The schema of the TG Get form */
const schema = yup.object({ twoFA: yup.string().default("") }).required();

/** The session string of an account, or null */
async function readSession(account) {
  return (await getAccountSession(account))?.session ?? null;
}

/** A hook for transferring accounts to the TG Get bot */
export default function useTgGetCore() {
  /** The accounts that have a Telegram user */
  const accounts = useAppStore((state) => state.accounts);
  const telegramAccounts = useMemo(
    () => accounts.filter(hasTelegramUser),
    [accounts],
  );

  /** The 2FA pool form */
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { twoFA: "" },
  });

  /** The picked main account */
  const [mainPartition, setMainPartition] = useState(null);
  /** Whether a transfer run is in flight */
  const [running, setRunning] = useState(false);
  /** The current step of each other account, by partition */
  const [steps, setSteps] = useState(() => new Map());
  /** The outcome of each other account, by partition */
  const [outcomes, setOutcomes] = useState(() => new Map());
  /** The number of others finished */
  const [progress, setProgress] = useState(0);

  /** The selection of the others */
  const othersSelector = useAccountsSelector(telegramAccounts, OTHERS_OPTIONS);

  /** The main account is a single pick, excluded from the others list */
  const toggleMain = useCallback(
    (partition, checked) => setMainPartition(checked ? partition : null),
    [],
  );
  const mainSelected = useMemo(
    () => new Set(mainPartition ? [mainPartition] : []),
    [mainPartition],
  );
  const mainSelector = useMemo(
    () => ({
      accounts: telegramAccounts,
      selected: mainSelected,
      selectedAccounts: telegramAccounts.filter((item) =>
        mainSelected.has(item.partition),
      ),
      toggleAccount: toggleMain,
      toggleAllAccounts: () => {},
    }),
    [telegramAccounts, mainSelected, toggleMain],
  );

  /** The others to transfer, never the main account */
  const others = useMemo(
    () =>
      othersSelector.selectedAccounts.filter(
        (item) => item.partition !== mainPartition,
      ),
    [othersSelector.selectedAccounts, mainPartition],
  );

  /** The main pool, without the accounts picked as others */
  const mainList = useMemo(
    () =>
      telegramAccounts.filter(
        (item) => !othersSelector.selected.has(item.partition),
      ),
    [telegramAccounts, othersSelector.selected],
  );
  /** The others pool, without the main account */
  const othersList = useMemo(
    () => telegramAccounts.filter((item) => item.partition !== mainPartition),
    [telegramAccounts, mainPartition],
  );

  /** Transfers the others through the main account */
  const run = useCallback(
    async (values) => {
      /** The main account */
      const mainAccount = telegramAccounts.find(
        (item) => item.partition === mainPartition,
      );

      if (!mainAccount) return toast.error("Pick a main account.");
      if (others.length === 0) return toast.error("Pick accounts to transfer.");

      /** The candidate 2FA passwords */
      const passwords = TgGet.parsePasswords(values.twoFA);
      /** The partitions held for the run */
      const release = holdPartitions([
        mainAccount.partition,
        ...others.map((item) => item.partition),
      ]);

      setRunning(true);
      setSteps(new Map());
      setOutcomes(new Map());
      setProgress(0);
      useAppStore.getState().closeAllAccounts();

      /** The transfer job behind a toast */
      const job = async () => {
        /** The main account's session */
        const mainSession = await readSession(mainAccount);

        if (!mainSession) throw new Error("The main account has no session.");

        /** The transfer run through the main account */
        const tgGet = new TgGet(mainSession);

        try {
          /* Connect, resolve the bot and cancel any open operation */
          await tgGet.start();

          const results = [];

          /* Transfer each other account in turn */
          for (const account of others) {
            const session = await readSession(account);

            /** The outcome of this account */
            const outcome = session
              ? await tgGet.transferAccount({
                  account,
                  session,
                  passwords,
                  onStep: (step) =>
                    setSteps((prev) =>
                      new Map(prev).set(account.partition, step),
                    ),
                })
              : { account, success: false, error: "No session" };

            if (outcome.success && outcome.seconds) {
              toast(
                `${account.title}: verifying in ${outcome.seconds} seconds`,
              );
            }

            results.push(outcome);
            setOutcomes((prev) =>
              new Map(prev).set(account.partition, outcome),
            );
            setProgress((count) => count + 1);
          }

          await saveJsonFile("tg-get-results", results);

          return TgGet.summarize(results);
        } finally {
          await tgGet.destroy();
        }
      };

      return toast
        .promise(job(), {
          loading: "Transferring accounts...",
          error: (error) => error.message || "Failed to transfer accounts!",
          success: (summary) => summary,
        })
        .catch((error) => console.error(error))
        .finally(() => {
          setRunning(false);
          release();
        });
    },
    [telegramAccounts, mainPartition, others],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(() => methods.handleSubmit(run), [methods, run]);

  return useMemo(
    () => ({
      methods,
      onSubmit,
      mainSelector,
      othersSelector,
      mainList,
      othersList,
      mainPartition,
      others,
      running,
      steps,
      outcomes,
      progress,
    }),
    [
      methods,
      onSubmit,
      mainSelector,
      othersSelector,
      mainList,
      othersList,
      mainPartition,
      others,
      running,
      steps,
      outcomes,
      progress,
    ],
  );
}

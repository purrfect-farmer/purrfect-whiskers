import {
  OPEN_TELEGRAM_WEB_COMMAND,
  buildSpiderAccount,
  buildSpiderBackup,
} from "../lib/spiderAccount";
import { useCallback, useRef } from "react";

import { NUMBERED_TITLE_DEFAULTS } from "../lib/titleSchema";
import Spider from "../lib/Spider";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import socket from "../lib/mirror";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useMutation } from "@tanstack/react-query";
import { useProgress } from "./useProgress";

/** Delay before switching a new account to Telegram Web */
const FINALIZE_DELAY = 2000;

/** Signs a purchased account in, opens it and switches it to Telegram Web */
async function setUpPurchasedAccount(account, purchase) {
  const { addAccount, launchAccount } = useAppStore.getState();

  addAccount(account);

  try {
    await getOrRestoreAccountBackup(
      account,
      buildSpiderBackup({ account, purchase }),
    );

    launchAccount(account.partition);

    await toast.promise(
      new Promise((resolve) => setTimeout(resolve, FINALIZE_DELAY)).then(() =>
        socket.send(OPEN_TELEGRAM_WEB_COMMAND),
      ),
      {
        loading: "Finalizing account setup...",
        success: "Account setup finalized!",
        error: "Error finalizing account setup.",
      },
    );
  } catch (error) {
    console.error("Error restoring account backup:", error);
  }
}

/** A hook for buying Spider accounts in batches, with cancellation */
export default function useSpiderPurchase(country) {
  /** The abort controller of the running purchase */
  const abortControllerRef = useRef(null);
  /** The Spider API key */
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  /** The progress of the purchase */
  const { progress, resetProgress, incrementProgress } = useProgress();

  /** The purchase of the accounts in batches */
  const mutation = useMutation({
    mutationKey: ["purchase-spider-accounts", spiderApiKey, country?.code],
    mutationFn: async ({
      count = 1,
      batch = 1,
      twoFA = "",
      enableLocalTelegramSession = true,
      title = NUMBERED_TITLE_DEFAULTS,
      tags = [],
    }) => {
      /** The abort controller of this purchase */
      const controller = new AbortController();
      abortControllerRef.current = controller;

      resetProgress();

      /** The Spider client */
      const spider = new Spider(spiderApiKey);
      /** The result of each purchase */
      const results = [];

      /** Buys and sets up the account at position `index` */
      const purchaseAt = async (index) => {
        try {
          if (controller.signal.aborted) return;

          /** The purchase response */
          const purchase = await spider.purchaseAccount({
            countryCode: country.code,
            enableLocalTelegramSession,
            twoFA,
          });

          if (!purchase.success) {
            throw new Error(
              purchase.error || "Unknown error purchasing account",
            );
          }

          /** The new account */
          const account = buildSpiderAccount({
            purchase,
            index,
            title,
            tags,
          });

          await setUpPurchasedAccount(account, purchase);

          results.push(purchase);
        } catch (error) {
          console.error("Error purchasing account:", error);
          results.push({ success: false, error: error.message });
        } finally {
          incrementProgress();
        }
      };

      for (let i = 0; i < count; i += batch) {
        if (controller.signal.aborted) break;

        /** The number of accounts in this batch */
        const size = Math.min(batch, count - i);

        await Promise.allSettled(
          Array.from({ length: size }, (_, j) => purchaseAt(i + j)),
        );
      }

      return results;
    },
  });

  /** The cancellation of the purchase */
  const cancelPurchase = useCallback(() => {
    abortControllerRef.current?.abort?.();
    toast.success("Initiated cancellation...");
  }, []);

  return { mutation, progress, cancelPurchase };
}

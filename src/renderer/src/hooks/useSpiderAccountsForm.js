import { useCallback, useMemo } from "react";

import { saveJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import useSpiderFormState from "./useSpiderFormState";
import useSpiderPurchase from "./useSpiderPurchase";

const useSpiderAccountsForm = ({ core }) => {
  const country = core.selectedCountry;
  const state = useSpiderFormState();
  const { mutation, progress, cancelPurchase } = useSpiderPurchase(country);

  /** Maximum purchasable accounts (available stock) */
  const maxCount = country?.quantity ?? 0;

  /** Calculate Total Price */
  const totalPrice = country ? (state.count * country.price).toFixed(2) : 0;

  /** Purchase Accounts */
  const purchaseAccounts = useCallback(async () => {
    /* Prevent purchasing above available quantity */
    if (state.count > maxCount) {
      toast.error(`Only ${maxCount} account(s) available for this country.`);
      return;
    }

    try {
      const results = await mutation.mutateAsync({
        count: state.count,
        batch: state.batch,
        twoFA: state.password,
        enableLocalTelegramSession: state.enableLocalTelegramSession,
        titlePrefix: state.titlePrefix,
        startNumber: state.startNumber,
        tags: state.tags,
      });

      await saveJsonFile("spider-purchase-results", results);

      toast.success("Account purchase process completed.");
    } catch (error) {
      console.error("Account purchase failed:", error);
      toast.error(`Account purchase failed: ${error.message}`);
    }
  }, [state, maxCount, mutation]);

  return useMemo(
    () => ({
      ...state,
      totalPrice,
      maxCount,
      country,
      mutation,
      progress,
      purchaseAccounts,
      cancelPurchase,
    }),
    [
      state,
      totalPrice,
      maxCount,
      country,
      mutation,
      progress,
      purchaseAccounts,
      cancelPurchase,
    ],
  );
};

export { useSpiderAccountsForm };

import * as yup from "yup";

import {
  NUMBERED_TITLE_DEFAULTS,
  numberedTitleFields,
} from "../lib/titleSchema";
import { useCallback, useEffect, useMemo } from "react";

import { saveJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import useSpiderPurchase from "./useSpiderPurchase";
import { yupResolver } from "@hookform/resolvers/yup";

/** The most accounts bought at once */
export const MAX_SPIDER_BATCH = 3;

/** The schema of the Spider purchase form */
const schema = yup
  .object({
    count: yup.number().integer().min(1).required().label("Number of Accounts"),
    batch: yup
      .number()
      .integer()
      .min(1)
      .max(MAX_SPIDER_BATCH)
      .required()
      .label("Batch"),
    password: yup.string().default("").label("2FA"),
    ...numberedTitleFields,
    tags: yup.array().of(yup.string()).required().default([]),
    enableLocalTelegramSession: yup.bool().required(),
  })
  .required();

/** The default values of the Spider purchase form */
const DEFAULT_VALUES = {
  count: 1,
  batch: 1,
  password: "",
  ...NUMBERED_TITLE_DEFAULTS,
  tags: [],
  enableLocalTelegramSession: true,
};

/** A hook for the Spider purchase form */
const useSpiderAccountsForm = ({ core }) => {
  const country = core.selectedCountry;
  const { mutation, progress, cancelPurchase } = useSpiderPurchase(country);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  /** Maximum purchasable accounts (available stock) */
  const maxCount = country?.quantity ?? 0;

  useEffect(() => {
    if (methods.getValues("count") > maxCount) {
      methods.setValue("count", Math.max(1, maxCount));
    }
  }, [methods, maxCount]);

  /** Purchase Accounts */
  const purchaseAccounts = useCallback(
    async (values) => {
      /* Prevent purchasing above available quantity */
      if (values.count > maxCount) {
        toast.error(`Only ${maxCount} account(s) available for this country.`);
        return;
      }

      try {
        const results = await mutation.mutateAsync({
          count: values.count,
          batch: values.batch,
          twoFA: values.password,
          enableLocalTelegramSession: values.enableLocalTelegramSession,
          title: {
            prefix: values.prefix,
            suffix: values.suffix,
            startNumber: values.startNumber,
            padding: values.padding,
          },
          tags: values.tags,
        });

        await saveJsonFile("spider-purchase-results", results);

        toast.success("Account purchase process completed.");
      } catch (error) {
        console.error("Account purchase failed:", error);
        toast.error(`Account purchase failed: ${error.message}`);
      }
    },
    [maxCount, mutation],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(purchaseAccounts),
    [methods, purchaseAccounts],
  );

  return useMemo(
    () => ({
      methods,
      onSubmit,
      maxCount,
      country,
      mutation,
      progress,
      cancelPurchase,
    }),
    [methods, onSubmit, maxCount, country, mutation, progress, cancelPurchase],
  );
};

export { useSpiderAccountsForm };

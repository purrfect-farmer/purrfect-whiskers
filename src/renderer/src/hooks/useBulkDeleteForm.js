import * as yup from "yup";

import { useCallback, useMemo } from "react";

import { deleteAccounts } from "../lib/accounts";
import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import { holdPartitions, isPartitionBusy } from "../lib/busyPartitions";
import { saveJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** The word typed to confirm a delete */
const CONFIRMATION_WORD = "delete";

/** The message shown until the delete is confirmed */
const CONFIRMATION_MESSAGE = `Type "${CONFIRMATION_WORD}" to confirm`;

/** The schema of the bulk delete form */
const schema = yup
  .object({
    backup: yup.boolean().required().default(true),
    confirmation: yup
      .string()
      .trim()
      .lowercase()
      .required(CONFIRMATION_MESSAGE)
      .oneOf([CONFIRMATION_WORD], CONFIRMATION_MESSAGE),
  })
  .required();

/** The default values of the bulk delete form */
const DEFAULT_VALUES = { backup: true, confirmation: "" };

/** Maps accounts to their partitions */
const toPartitions = (accounts) => accounts.map((item) => item.partition);

/** The backup of an account, or null when it can't be read */
async function backUpAccount(account) {
  try {
    return { account, backup: await getOrRestoreAccountBackup(account) };
  } catch (error) {
    console.error(error);

    return { account, backup: null };
  }
}

/** The summary of a delete, naming what was left */
function summarizeDelete({ removed, busy, notBackedUp, notWiped }) {
  /** The parts of the summary */
  const parts = [`Deleted ${removed} account(s)`];

  if (busy > 0) parts.push(`${busy} busy`);
  if (notBackedUp > 0) parts.push(`${notBackedUp} couldn't be backed up`);
  if (notWiped > 0) parts.push(`${notWiped} couldn't be removed`);

  return parts.length > 1
    ? `${parts[0]}; kept ${parts.slice(1).join(", ")}`
    : parts[0];
}

/** A hook for the bulk delete form, backing up through `run` */
export default function useBulkDeleteForm(selectedAccounts, run) {
  /** The form methods */
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  /** The delete of the selected accounts that aren't busy */
  const deleteSelected = useCallback(
    async (values) => {
      /** The selected accounts that aren't busy */
      const idle = selectedAccounts.filter(
        (account) => !isPartitionBusy(account.partition),
      );

      /** The number of busy accounts left alone */
      const busy = selectedAccounts.length - idle.length;

      if (idle.length === 0) {
        throw new Error("The selected accounts are busy with other tasks");
      }

      /** The release of the accounts being deleted */
      const release = holdPartitions(toPartitions(idle));

      try {
        /** The accounts to delete */
        let deletable = idle;

        if (values.backup) {
          /** The backup of each account */
          const results = await run(idle, backUpAccount, {
            partitions: toPartitions(idle),
          });

          /** The accounts with a backup */
          const backedUp = results.filter((item) => item.backup);

          if (backedUp.length === 0) {
            throw new Error("No account could be backed up; none was deleted");
          }

          await saveJsonFile("purrfect-whiskers-deleted-accounts", {
            accounts: backedUp,
          });

          deletable = backedUp.map((item) => item.account);
        }

        /** The partitions removed */
        const removed = await deleteAccounts(toPartitions(deletable));

        methods.reset();

        return summarizeDelete({
          removed: removed.length,
          busy,
          notBackedUp: idle.length - deletable.length,
          notWiped: deletable.length - removed.length,
        });
      } finally {
        release();
      }
    },
    [selectedAccounts, run, methods],
  );

  /** The delete, reported in a toast */
  const submit = useCallback(
    (values) =>
      toast
        .promise(deleteSelected(values), {
          loading: values.backup
            ? "Backing up and deleting accounts..."
            : "Deleting accounts...",
          success: (summary) => summary,
          error: (error) => error.message || "Failed to delete accounts!",
        })
        .catch((error) => console.error(error)),
    [deleteSelected],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(submit),
    [methods, submit],
  );

  return { methods, onSubmit };
}

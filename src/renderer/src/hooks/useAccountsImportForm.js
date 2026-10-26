import * as yup from "yup";

import { parseAccountsFile, withoutTags } from "../lib/accountsFile";
import { useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { getOrRestoreAccountBackup } from "../lib/accountBackup";
import { readJsonFile } from "../lib/utils";
import toast from "react-hot-toast";
import useAccountsSelector from "./useAccountsSelector";
import useAppStore from "../store/useAppStore";
import { yupResolver } from "@hookform/resolvers/yup";

/** The schema of the import form */
const schema = yup
  .object({
    file: yup
      .object({
        name: yup.string().required(),
        accounts: yup.array().min(1).required(),
      })
      .nullable()
      .required("Choose an accounts file"),
    tags: yup.array().of(yup.string()).required().default([]),
  })
  .required();

/** The default values of the import form */
const DEFAULT_VALUES = { file: null, tags: [] };

/** The empty list of accounts */
const NO_ACCOUNTS = [];

/** The accounts of a file not already in the app, without their tags */
function getImportableAccounts(items) {
  const existing = new Set(
    useAppStore.getState().accounts.map((account) => account.partition),
  );

  return items
    .filter(({ account }) => !existing.has(account.partition))
    .map(({ account }) => withoutTags(account));
}

/** A hook for importing the selected accounts of a file with chosen tags */
export default function useAccountsImportForm(run) {
  /** The form methods */
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  /** The picked file */
  const file = useWatch({ control: methods.control, name: "file" });
  /** The accounts of the file that can be imported */
  const importable = file?.importable ?? NO_ACCOUNTS;

  /** The number of accounts in the file already in the app */
  const skippedCount = file ? file.accounts.length - importable.length : 0;

  /** The selection over the importable accounts */
  const selector = useAccountsSelector(importable);
  const { selectedAccounts, setSelected } = selector;

  /** The setter for the picked file and its selection */
  const setFile = useCallback(
    (value) => {
      methods.setValue("file", value, { shouldValidate: value !== null });
      setSelected(
        new Set(value?.importable.map((account) => account.partition)),
      );
    },
    [methods, setSelected],
  );

  /** The reader for a dropped file */
  const pickFile = useCallback(
    async (dropped) => {
      if (!dropped) return;

      let data;

      try {
        data = await readJsonFile(dropped);
      } catch {
        setFile(null);
        methods.setError("file", { message: "Invalid JSON file" });
        return;
      }

      const items = parseAccountsFile(data);

      if (!items) {
        setFile(null);
        methods.setError("file", { message: "Not an accounts export file" });
        return;
      }

      setFile({
        name: dropped.name,
        accounts: items,
        importable: getImportableAccounts(items),
      });
    },
    [methods, setFile],
  );

  /** The import of the selected accounts */
  const importAccounts = useCallback(
    async (values) => {
      const backups = new Map(
        values.file.accounts.map(({ account, backup }) => [
          account.partition,
          backup,
        ]),
      );

      const store = useAppStore.getState();

      store.closeAllAccounts();

      await run(selectedAccounts, (account) =>
        getOrRestoreAccountBackup(account, backups.get(account.partition)),
      );

      store.importAccounts(
        selectedAccounts.map((account) => ({
          ...account,
          tags: [...values.tags],
        })),
      );

      methods.reset(DEFAULT_VALUES);
      setSelected(new Set());
    },
    [run, selectedAccounts, methods, setSelected],
  );

  /** The import with its progress toast */
  const submit = useCallback(
    (values) => {
      if (selectedAccounts.length === 0) {
        toast.error("Select the accounts to import.");
        return;
      }

      return toast
        .promise(importAccounts(values), {
          loading: "Importing accounts...",
          error: "Failed to Import Accounts!",
          success: "Accounts were successfully imported!",
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [selectedAccounts, importAccounts],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(submit),
    [methods, submit],
  );

  return { methods, onSubmit, pickFile, selector, skippedCount };
}

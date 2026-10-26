import * as yup from "yup";

import {
  NUMBERED_TITLE_DEFAULTS,
  numberedTitleFields,
} from "../lib/titleSchema";
import { RENAME_MODE, buildTitles } from "../lib/titles";
import { useCallback, useMemo } from "react";

import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    mode: yup.string().oneOf(Object.values(RENAME_MODE)).required(),
    ...numberedTitleFields,
  })
  .test("affix", "Enter a prefix or a suffix", function (values) {
    const hasAffix = Boolean(values.prefix.trim() || values.suffix.trim());

    if (values.mode !== RENAME_MODE.AFFIX || hasAffix) {
      return true;
    }

    return this.createError({ path: "prefix" });
  })
  .required();

const DEFAULT_VALUES = {
  mode: RENAME_MODE.NUMBERED,
  ...NUMBERED_TITLE_DEFAULTS,
};

/** Renames the selected accounts, numbered in their saved order */
export default function useBulkRenameForm(selectedAccounts) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const renameAccounts = useCallback(
    (values) => {
      const renamed = useAppStore
        .getState()
        .renameAccounts(buildTitles(selectedAccounts, values));

      if (renamed > 0) {
        toast.success(`Renamed ${renamed} account(s)!`);
      } else {
        toast("The selected accounts already have these titles.");
      }
    },
    [selectedAccounts],
  );

  const onSubmit = useMemo(
    () => methods.handleSubmit(renameAccounts),
    [methods, renameAccounts],
  );

  return { methods, onSubmit };
}

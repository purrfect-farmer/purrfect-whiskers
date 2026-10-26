import * as yup from "yup";

import { useCallback, useMemo } from "react";

import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    add: yup.array().of(yup.string()).required().default([]),
    remove: yup.array().of(yup.string()).required().default([]),
  })
  .test("tags", "Choose tags to add or remove", function (values) {
    if (values.add.length === 0 && values.remove.length === 0) {
      return this.createError({ path: "add" });
    }

    const added = new Set(values.add);

    if (values.remove.some((tagId) => added.has(tagId))) {
      return this.createError({
        path: "remove",
        message: "A tag can't be added and removed at once",
      });
    }

    return true;
  })
  .required();

const DEFAULT_VALUES = { add: [], remove: [] };

/** A hook for the bulk tags form */
export default function useBulkTagsForm(selectedAccounts) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  /** The tag update of the selected accounts */
  const updateTags = useCallback(
    (values) => {
      const updated = useAppStore.getState().updateAccountsTags(
        selectedAccounts.map((account) => account.partition),
        values.add,
        values.remove,
      );

      if (updated > 0) {
        toast.success(`Updated tags of ${updated} account(s)!`);
      } else {
        toast("The selected accounts already have these tags.");
      }
    },
    [selectedAccounts],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(updateTags),
    [methods, updateTags],
  );

  return { methods, onSubmit };
}

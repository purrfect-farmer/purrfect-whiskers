import * as yup from "yup";

import {
  countTagUsage,
  findAccountsWithTags,
  findTagIssues,
  summarizeTagRemoval,
} from "../lib/tags";
import { useCallback, useMemo } from "react";

import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

/** The schema of the tags cleaner form */
const schema = yup
  .object({
    skipped: yup.array().of(yup.string()).required().default([]),
  })
  .required();

/** The default values of the tags cleaner form */
const DEFAULT_VALUES = { skipped: [] };

/** A hook for finding and removing unused and unknown tags */
export default function useTagsCleaner() {
  /** The list of tags */
  const tags = useAppStore((state) => state.tags);
  /** The list of accounts */
  const accounts = useAppStore((state) => state.accounts);

  /** The number of accounts carrying each tag id */
  const usage = useMemo(() => countTagUsage(accounts), [accounts]);

  /** The unused tags and the unknown tag ids */
  const { unused, unknown } = useMemo(
    () => findTagIssues(tags, usage),
    [tags, usage],
  );

  /** The accounts carrying each unknown tag */
  const unknownAccounts = useMemo(
    () =>
      findAccountsWithTags(
        accounts,
        unknown.map((tag) => tag.id),
      ),
    [accounts, unknown],
  );

  /** The list of found tag ids */
  const foundIds = useMemo(
    () => [...unused.map((tag) => tag.id), ...unknown.map((tag) => tag.id)],
    [unused, unknown],
  );

  /** The form methods */
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  /** The toggle for a found tag */
  const toggleTag = useCallback(
    (id, checked) => {
      const skipped = methods.getValues("skipped");

      methods.setValue(
        "skipped",
        checked ? skipped.filter((item) => item !== id) : [...skipped, id],
      );
    },
    [methods],
  );

  /** Checks or unchecks every tag in `ids` */
  const setTagsChecked = useCallback(
    (ids, checked) => {
      /** The tag ids being changed */
      const changed = new Set(ids);

      /** The other unchecked tag ids */
      const others = methods
        .getValues("skipped")
        .filter((id) => !changed.has(id));

      methods.setValue("skipped", checked ? others : [...others, ...ids]);
    },
    [methods],
  );

  /** The removal of the checked tags */
  const removeTags = useCallback(
    (values) => {
      const skipped = new Set(values.skipped);
      const ids = foundIds.filter((id) => !skipped.has(id));

      if (ids.length === 0) return;

      /** What the removal does, for the toast */
      const summary = summarizeTagRemoval({
        unused,
        unknown,
        unknownAccounts,
        skipped,
        done: true,
      });

      useAppStore.getState().removeTags(ids);
      methods.reset(DEFAULT_VALUES);

      toast.success(summary);
    },
    [foundIds, unused, unknown, unknownAccounts, methods],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(removeTags),
    [methods, removeTags],
  );

  return {
    methods,
    onSubmit,
    unused,
    unknown,
    unknownAccounts,
    foundIds,
    toggleTag,
    setTagsChecked,
    tagCount: tags.length,
    accountCount: accounts.length,
  };
}

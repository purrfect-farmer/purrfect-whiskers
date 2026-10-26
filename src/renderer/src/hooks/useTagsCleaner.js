import * as yup from "yup";

import { countTagUsage, findTagIssues } from "../lib/tags";
import { useCallback, useMemo } from "react";

import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    skipped: yup.array().of(yup.string()).required().default([]),
  })
  .required();

const DEFAULT_VALUES = { skipped: [] };

/** A hook for finding and removing unused and unknown tags */
export default function useTagsCleaner() {
  const tags = useAppStore((state) => state.tags);
  const accounts = useAppStore((state) => state.accounts);

  /** The number of accounts carrying each tag id */
  const usage = useMemo(() => countTagUsage(accounts), [accounts]);

  /** The unused tags and the unknown tag ids */
  const { unused, unknown } = useMemo(
    () => findTagIssues(tags, usage),
    [tags, usage],
  );

  /** The list of found tag ids */
  const foundIds = useMemo(
    () => [...unused.map((tag) => tag.id), ...unknown.map((tag) => tag.id)],
    [unused, unknown],
  );

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

  /** The removal of the checked tags */
  const removeTags = useCallback(
    (values) => {
      const skipped = new Set(values.skipped);
      const ids = foundIds.filter((id) => !skipped.has(id));

      if (ids.length === 0) return;

      useAppStore.getState().removeTags(ids);
      methods.reset(DEFAULT_VALUES);

      toast.success(`Removed ${ids.length} tag(s)!`);
    },
    [foundIds, methods],
  );

  /** The submit handler of the form */
  const onSubmit = useMemo(
    () => methods.handleSubmit(removeTags),
    [methods, removeTags],
  );

  return { methods, onSubmit, unused, unknown, foundIds, toggleTag };
}

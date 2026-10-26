import { UNTAGGED_TAG, accountMatchesTag } from "../lib/tags";
import { useCallback, useMemo, useState } from "react";

import { matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

/** A hook for filtering accounts by search and tag */
export default function useAccountsFilter(accounts) {
  /** The search text */
  const [search, setSearch] = useState("");
  /** The id of the selected tag */
  const [selectedTag, setSelectedTag] = useState(null);
  /** Whether the active tag is excluded */
  const [excluded, setExcluded] = useState(false);
  /** The list of tags */
  const tags = useAppStore((state) => state.tags);

  /** The tags offered as filters, led by Untagged */
  const filterTags = useMemo(
    () => (tags.length > 0 ? [UNTAGGED_TAG, ...tags] : tags),
    [tags],
  );

  /** The tag currently filtering the list */
  const activeTag = useMemo(
    () =>
      selectedTag === UNTAGGED_TAG.id
        ? UNTAGGED_TAG
        : selectedTag
          ? (tags.find((item) => item.id === selectedTag) ?? null)
          : null,
    [tags, selectedTag],
  );

  /** The reset of a selected tag that no longer exists */
  if (selectedTag && !activeTag) {
    setSelectedTag(null);
    setExcluded(false);
  }

  /** The toggle for a tag filter */
  const selectTag = useCallback((id) => {
    setSearch("");
    setExcluded(false);
    setSelectedTag((prev) => (prev === id ? null : id));
  }, []);

  /** The switch between including and excluding the active tag */
  const toggleExcluded = useCallback(() => {
    setSearch("");
    setExcluded((prev) => !prev);
  }, []);

  /** The filtered list of accounts */
  const list = useMemo(
    () =>
      search
        ? accounts.filter((item) => matchesSearch(search, item))
        : activeTag
          ? accounts.filter(
              (item) => accountMatchesTag(item, activeTag.id) !== excluded,
            )
          : accounts,
    [search, activeTag, excluded, accounts],
  );

  return {
    tags,
    filterTags,
    search,
    setSearch,
    selectedTag,
    activeTag,
    selectTag,
    excluded,
    toggleExcluded,
    list,
  };
}

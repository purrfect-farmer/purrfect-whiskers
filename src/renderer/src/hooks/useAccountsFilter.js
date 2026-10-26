import { UNTAGGED_TAG, accountMatchesTag } from "../lib/tags";
import { useCallback, useMemo, useState } from "react";

import { matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

export default function useAccountsFilter(accounts) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [excluded, setExcluded] = useState(false);
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

  if (selectedTag && !activeTag) {
    setSelectedTag(null);
    setExcluded(false);
  }

  /** Clicking a tag clears the search, since search takes precedence below */
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

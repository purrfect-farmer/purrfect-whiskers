import { UNTAGGED_TAG, accountMatchesTag } from "../lib/tags";
import { useCallback, useMemo, useState } from "react";

import { matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

export default function useAccountsFilter(accounts) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [excluded, setExcluded] = useState(false);
  const tags = useAppStore((state) => state.tags);

  /** Tags offered as filters, led by Untagged once any tag exists */
  const filterTags = useMemo(
    () => (tags.length > 0 ? [UNTAGGED_TAG, ...tags] : tags),
    [tags],
  );

  const activeTag = useMemo(
    () =>
      selectedTag === UNTAGGED_TAG.id
        ? UNTAGGED_TAG
        : selectedTag
          ? (tags.find((item) => item.id === selectedTag) ?? null)
          : null,
    [tags, selectedTag],
  );

  /** A deleted tag stops being the filter, along with its exclude mode */
  if (selectedTag && !activeTag) {
    setSelectedTag(null);
    setExcluded(false);
  }

  /**
   * Clicking a tag clears the search, since search takes precedence below.
   * A newly selected tag starts as an include filter.
   */
  const selectTag = useCallback((id) => {
    setSearch("");
    setExcluded(false);
    setSelectedTag((prev) => (prev === id ? null : id));
  }, []);

  /** Switches the active tag between including and excluding its accounts */
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

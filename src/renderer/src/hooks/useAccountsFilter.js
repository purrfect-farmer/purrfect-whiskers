import { useCallback, useMemo, useState } from "react";

import { matchesSearch } from "../lib/utils";
import useAppStore from "../store/useAppStore";

export default function useAccountsFilter(accounts) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const tags = useAppStore((state) => state.tags);

  const activeTag = selectedTag
    ? tags.find((item) => item.id === selectedTag)
    : null;

  /** Clicking a tag clears the search, since search takes precedence below */
  const selectTag = useCallback((id) => {
    setSearch("");
    setSelectedTag((prev) => (prev === id ? null : id));
  }, []);

  const list = useMemo(
    () =>
      search
        ? accounts.filter((item) => matchesSearch(search, item))
        : activeTag
          ? accounts.filter((item) => item.tags?.includes(activeTag.id))
          : accounts,
    [search, activeTag, accounts],
  );

  return { tags, search, setSearch, selectedTag, activeTag, selectTag, list };
}

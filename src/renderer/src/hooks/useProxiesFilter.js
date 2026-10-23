import { useMemo, useState } from "react";

import { getCountry } from "../lib/countries";

/** Lower-cased text a proxy is searched by */
const getSearchText = (proxy, country) =>
  [proxy.host, proxy.port, proxy.city, country?.name, country?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export default function useProxiesFilter(proxies) {
  const [search, setSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState(null);

  /** Keep the original position so the number matches the assignment order */
  const indexed = useMemo(
    () =>
      proxies.map((proxy, index) => {
        const country = getCountry(proxy.countryCode);

        return {
          proxy,
          index,
          countryCode: country?.code || null,
          searchText: getSearchText(proxy, country),
        };
      }),
    [proxies],
  );

  /** Countries sorted by proxy count */
  const countries = useMemo(() => {
    const counts = new Map();

    for (const { countryCode } of indexed) {
      if (!countryCode) continue;
      counts.set(countryCode, (counts.get(countryCode) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([code, count]) => ({ ...getCountry(code), count }))
      .sort((a, b) => b.count - a.count);
  }, [indexed]);

  /** Filtered List */
  const list = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term && !activeCountry) return indexed;

    return indexed.filter(
      (item) =>
        (!activeCountry || item.countryCode === activeCountry) &&
        (!term || item.searchText.includes(term)),
    );
  }, [indexed, search, activeCountry]);

  const validCount = useMemo(
    () => proxies.filter((proxy) => proxy.valid === true).length,
    [proxies],
  );

  return {
    search,
    setSearch,
    activeCountry,
    setActiveCountry,
    countries,
    list,
    validCount,
  };
}

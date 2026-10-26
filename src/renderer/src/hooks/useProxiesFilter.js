import { useMemo, useState } from "react";

import { getCountry } from "../lib/countries";

/** The lower-cased text a proxy is searched by */
const getSearchText = (proxy, country) =>
  [proxy.host, proxy.port, proxy.city, country?.name, country?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

/** A hook for filtering proxies by search and country */
export default function useProxiesFilter(proxies) {
  /** The search text */
  const [search, setSearch] = useState("");
  /** The code of the active country */
  const [activeCountry, setActiveCountry] = useState(null);

  /** The proxies with their position, country and search text */
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

  /** The countries sorted by proxy count */
  const countries = useMemo(() => {
    /** The number of proxies in each country */
    const counts = new Map();

    for (const { countryCode } of indexed) {
      if (!countryCode) continue;
      counts.set(countryCode, (counts.get(countryCode) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([code, count]) => ({ ...getCountry(code), count }))
      .sort((a, b) => b.count - a.count);
  }, [indexed]);

  /** The filtered list of proxies */
  const list = useMemo(() => {
    /** The search term */
    const term = search.trim().toLowerCase();

    if (!term && !activeCountry) return indexed;

    return indexed.filter(
      (item) =>
        (!activeCountry || item.countryCode === activeCountry) &&
        (!term || item.searchText.includes(term)),
    );
  }, [indexed, search, activeCountry]);

  /** The number of valid proxies */
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

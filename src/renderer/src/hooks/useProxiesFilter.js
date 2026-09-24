import { useMemo, useState } from "react";

import { getCountry } from "../lib/proxy/utils";

export default function useProxiesFilter(proxies) {
  const [search, setSearch] = useState("");
  const [activeCountry, setActiveCountry] = useState(null);

  /** Keep the original position so the number matches the assignment order */
  const indexed = useMemo(
    () => proxies.map((proxy, index) => ({ proxy, index })),
    [proxies],
  );

  /** Countries sorted by proxy count */
  const countries = useMemo(() => {
    const counts = new Map();

    for (const { countryCode } of proxies) {
      if (!countryCode) continue;
      const code = countryCode.toUpperCase();
      counts.set(code, (counts.get(code) || 0) + 1);
    }

    return [...counts.entries()]
      .map(([code, count]) => ({ ...getCountry(code), count }))
      .sort((a, b) => b.count - a.count);
  }, [proxies]);

  /** Filtered List */
  const list = useMemo(() => {
    const term = search.trim().toLowerCase();

    return indexed.filter(({ proxy }) => {
      if (activeCountry && proxy.countryCode?.toUpperCase() !== activeCountry) {
        return false;
      }

      if (!term) return true;

      const country = getCountry(proxy.countryCode);

      return [proxy.host, proxy.port, proxy.city, country?.name, country?.code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
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

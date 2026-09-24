import { HiOutlineGlobeAlt, HiOutlineSquare2Stack } from "react-icons/hi2";
import { getCountryData, getEmojiFlag } from "countries-list";
import { memo, useMemo, useState } from "react";

import Input from "./Input";
import { Virtuoso } from "react-virtuoso";
import { cn } from "../lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import toast from "react-hot-toast";

/** Same as Tailwind's h-80 */
const MAX_LIST_HEIGHT = 320;

/** Resolve country details from an ISO code */
function getCountry(code) {
  if (!code) return null;

  const upper = code.toUpperCase();
  const data = getCountryData(upper);

  return data
    ? { code: upper, name: data.name, emoji: getEmojiFlag(upper) }
    : { code: upper, name: upper, emoji: null };
}

const ProxyListItem = memo(function ProxyListItem({ proxy, index }) {
  const country = getCountry(proxy.countryCode);
  const location = [proxy.city, country?.name].filter(Boolean).join(", ");

  /** Copy Proxy URL */
  const copyProxy = async () => {
    const auth = proxy.username
      ? `${proxy.username}:${proxy.password || ""}@`
      : "";

    await navigator.clipboard.writeText(
      `http://${auth}${proxy.host}:${proxy.port}`,
    );
    toast.success("Proxy copied!");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      {/* Flag */}
      <span
        title={country?.name}
        className={cn(
          "size-10 shrink-0 rounded-lg text-2xl",
          "flex items-center justify-center",
        )}
      >
        {country?.emoji || (
          <HiOutlineGlobeAlt className="size-5 text-neutral-400" />
        )}
      </span>

      {/* Details */}
      <div className="flex flex-col min-w-0 grow">
        <p className="font-mono font-bold truncate">
          {proxy.host}:{proxy.port}
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 truncate">
          {location || "Unknown location"}
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-col items-end shrink-0 text-xs gap-1">
        <span className="text-neutral-400">#{index + 1}</span>
        {typeof proxy.valid === "boolean" ? (
          <span
            title={
              proxy.lastVerification
                ? `Verified ${formatDistanceToNowStrict(new Date(proxy.lastVerification), { addSuffix: true })}`
                : undefined
            }
            className={cn(
              "flex items-center gap-1 font-bold",
              proxy.valid ? "text-green-500" : "text-red-500",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                proxy.valid ? "bg-green-500" : "bg-red-500",
              )}
            />
            {proxy.valid ? "Valid" : "Invalid"}
          </span>
        ) : null}
      </div>

      {/* Copy */}
      <button
        type="button"
        title="Copy Proxy"
        onClick={copyProxy}
        className={cn(
          "p-2 rounded-lg shrink-0",
          "hover:bg-orange-100 hover:text-orange-500",
          "dark:hover:bg-neutral-600",
        )}
      >
        <HiOutlineSquare2Stack className="size-4" />
      </button>
    </div>
  );
});

export default function ProxyList({ proxies }) {
  const [listHeight, setListHeight] = useState(0);
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

  return (
    <div className="flex flex-col gap-2">
      {/* Heading */}
      <div className="flex items-center justify-center gap-2">
        <h4 className="font-bold">Proxies ({proxies.length})</h4>
        {validCount > 0 ? (
          <span className="text-xs font-bold text-green-500">
            {validCount} valid
          </span>
        ) : null}
      </div>

      {proxies.length > 0 ? (
        <>
          {/* Countries */}
          {countries.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {[{ code: null, name: "All", count: proxies.length }]
                .concat(countries)
                .map((country) => (
                  <button
                    key={country.code || "all"}
                    title={country.name}
                    onClick={() => setActiveCountry(country.code)}
                    className={cn(
                      "px-2 py-1 rounded-full",
                      "flex items-center gap-1",
                      "border border-transparent",
                      activeCountry === country.code
                        ? "border-orange-500 bg-orange-100 text-orange-500 dark:bg-neutral-700"
                        : "bg-neutral-100 dark:bg-neutral-700",
                    )}
                  >
                    {country.emoji ? <span>{country.emoji}</span> : null}
                    <span className="font-bold">
                      {country.code || country.name}
                    </span>
                    <span className="text-xs opacity-70">{country.count}</span>
                  </button>
                ))}
            </div>
          ) : null}

          {/* Search */}
          <Input
            type="search"
            placeholder="Search by host, city or country"
            value={search}
            onChange={(ev) => setSearch(ev.target.value)}
          />

          {/* List */}
          {list.length > 0 ? (
            <div
              className="min-h-px -mx-2"
              style={{ height: Math.min(listHeight, MAX_LIST_HEIGHT) }}
            >
              <Virtuoso
                style={{ height: "100%" }}
                data={list}
                totalListHeightChanged={setListHeight}
                computeItemKey={(_, item) => item.index}
                itemContent={(_, item) => (
                  <div className="pb-2 px-2">
                    <ProxyListItem proxy={item.proxy} index={item.index} />
                  </div>
                )}
              />
            </div>
          ) : (
            <p className="text-center text-neutral-500 dark:text-neutral-400">
              No proxies match your filter.
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          No proxies fetched yet.
        </p>
      )}
    </div>
  );
}

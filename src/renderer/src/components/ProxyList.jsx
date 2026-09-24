import { useCallback, useState } from "react";

import Input from "./Input";
import ProxyCountryFilter from "./ProxyCountryFilter";
import ProxyListItem from "./ProxyListItem";
import { Virtuoso } from "react-virtuoso";
import useProxiesFilter from "../hooks/useProxiesFilter";

/** Same as Tailwind's h-80 */
const MAX_LIST_HEIGHT = 320;

export default function ProxyList({ proxies }) {
  const [listHeight, setListHeight] = useState(0);
  const [expanded, setExpanded] = useState(() => new Set());
  const [previousProxies, setPreviousProxies] = useState(proxies);

  /** Collapse everything when a new list is loaded */
  if (previousProxies !== proxies) {
    setPreviousProxies(proxies);
    setExpanded(new Set());
  }

  /** Toggle Expanded */
  const toggleExpanded = useCallback((index) => {
    setExpanded((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }, []);

  /** Filter */
  const {
    search,
    setSearch,
    activeCountry,
    setActiveCountry,
    countries,
    list,
    validCount,
  } = useProxiesFilter(proxies);

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
            <ProxyCountryFilter
              countries={countries}
              total={proxies.length}
              activeCountry={activeCountry}
              onSelect={setActiveCountry}
            />
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
                    <ProxyListItem
                      proxy={item.proxy}
                      index={item.index}
                      expanded={expanded.has(item.index)}
                      onToggle={toggleExpanded}
                    />
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

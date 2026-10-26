import { BADGE_TONE } from "../lib/constants";
import { useCallback, useState } from "react";

import Input from "./Input";
import ProxyCountryFilter from "./ProxyCountryFilter";
import ProxyListItem from "./ProxyListItem";
import SectionBadge from "./SectionBadge";
import SectionHeader from "./SectionHeader";
import { Virtuoso } from "react-virtuoso";
import { formatNumber } from "../lib/utils";
import useProxiesFilter from "../hooks/useProxiesFilter";

/** The maximum height of the list */
const MAX_LIST_HEIGHT = 320;

/** The key of a proxy row */
const computeItemKey = (_, item) => item.index;

/** A searchable, filterable, virtualized list of proxies */
export default function ProxyList({ proxies }) {
  /** The height of the list's content */
  const [listHeight, setListHeight] = useState(0);
  /** The indexes of the expanded proxies */
  const [expanded, setExpanded] = useState(() => new Set());
  /** The proxies from the previous render */
  const [previousProxies, setPreviousProxies] = useState(proxies);

  /** Collapse everything when a new list is loaded */
  if (previousProxies !== proxies) {
    setPreviousProxies(proxies);
    setExpanded(new Set());
  }

  /** The toggle for an expanded proxy */
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

  /** The search, country filter and filtered list of proxies */
  const {
    search,
    setSearch,
    activeCountry,
    setActiveCountry,
    countries,
    list,
    validCount,
  } = useProxiesFilter(proxies);

  /** The content of a proxy row */
  const itemContent = useCallback(
    (_, item) => (
      <div className="pb-2 px-2">
        <ProxyListItem
          proxy={item.proxy}
          index={item.index}
          expanded={expanded.has(item.index)}
          onToggle={toggleExpanded}
        />
      </div>
    ),
    [expanded, toggleExpanded],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Heading */}
      <SectionHeader
        title="Proxies"
        badge={
          <>
            <SectionBadge>{formatNumber(proxies.length)}</SectionBadge>
            {validCount > 0 ? (
              <SectionBadge tone={BADGE_TONE.GREEN}>
                {formatNumber(validCount)} valid
              </SectionBadge>
            ) : null}
          </>
        }
      />

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
                computeItemKey={computeItemKey}
                itemContent={itemContent}
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

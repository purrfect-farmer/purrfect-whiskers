import { useCallback, useMemo, useState } from "react";

import Spider from "../lib/Spider";
import { getCountry } from "../lib/countries";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useQuery } from "@tanstack/react-query";

/** The refresh interval of the balance and stock */
const REFRESH_INTERVAL = 60_000;

/** The Spider group whose countries can be purchased */
const PURCHASABLE_GROUP = "1";

/** The keys the countries can be sorted by */
const SORT_KEY = Object.freeze({ NAME: "name", PRICE: "price" });
/** The directions of the sort */
const SORT_DIR = Object.freeze({ ASC: "asc", DESC: "desc" });

/** Flattens Spider's grouped country prices into a list */
function parseCountries(data) {
  if (!data?.countries) return [];

  /** The quantities, under Spider's misspelled "cuantity" key */
  const quantities = data.cuantity || data.quantity || {};

  return Object.entries(data.countries).flatMap(([group, list]) =>
    Object.entries(list).map(([code, price]) => {
      const country = getCountry(code);

      return {
        code,
        price: parseFloat(price),
        quantity: quantities?.[group]?.[code] ?? 0,
        emoji: country.emoji,
        name: country.name,
        group,
      };
    }),
  );
}

/**
 * A hook for the Spider balance, countries and country selection.
 * Requests only run while `active`.
 */
const useSpiderCore = ({ active }) => {
  /** The Spider API key */
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  /** The country search text */
  const [searchTerm, setSearchTerm] = useState("");
  /** The key the countries are sorted by */
  const [sortKey, setSortKey] = useState(SORT_KEY.NAME);
  /** The direction of the sort */
  const [sortDir, setSortDir] = useState(SORT_DIR.ASC);
  /** The country chosen for purchase */
  const [selectedCountry, setSelectedCountry] = useState(null);

  /** Whether the requests run */
  const enabled = Boolean(spiderApiKey) && active;

  /** The query of the balance */
  const balanceQuery = useQuery({
    queryKey: ["spider-balance", spiderApiKey],
    queryFn: () => new Spider(spiderApiKey).getBalance(),
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });

  /** The wallet balance */
  const balance = balanceQuery.data?.wallet || 0;

  /** The query of the countries */
  const countriesQuery = useQuery({
    queryKey: ["spider-countries", spiderApiKey],
    queryFn: () => new Spider(spiderApiKey).getCountries(),
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });

  /** The purchasable countries */
  const availableCountries = useMemo(() => {
    try {
      return parseCountries(countriesQuery.data).filter(
        (item) => item.group === PURCHASABLE_GROUP,
      );
    } catch (e) {
      console.error("Error processing countries:", e);
      return [];
    }
  }, [countriesQuery.data]);

  /** The countries filtered by search and sorted */
  const filteredCountries = useMemo(() => {
    /** The lower-cased search term */
    const term = searchTerm.toLowerCase();
    /** The sign of the sort direction */
    const direction = sortDir === SORT_DIR.DESC ? -1 : 1;

    return availableCountries
      .filter((item) => item.name.toLowerCase().includes(term))
      .sort((a, b) => {
        const comparison =
          sortKey === SORT_KEY.PRICE
            ? a.price - b.price
            : a.name.localeCompare(b.name);
        return comparison * direction;
      });
  }, [availableCountries, searchTerm, sortKey, sortDir]);

  /** The selection of a country in stock and within balance */
  const selectCountry = useCallback(
    (item) => {
      if (item.quantity <= 0) {
        toast.error("This country is out of stock.");
        return;
      }
      if (item.price > balance) {
        toast.error("Insufficient balance for this country.");
        return;
      }
      setSelectedCountry(item);
    },
    [balance],
  );

  /** The toggle of the sort direction */
  const toggleSortDir = useCallback(
    () =>
      setSortDir((dir) =>
        dir === SORT_DIR.ASC ? SORT_DIR.DESC : SORT_DIR.ASC,
      ),
    [],
  );

  return useMemo(
    () => ({
      spiderApiKey,
      searchTerm,
      setSearchTerm,
      sortKey,
      setSortKey,
      sortDir,
      toggleSortDir,
      selectedCountry,
      setSelectedCountry,
      balanceQuery,
      countriesQuery,
      filteredCountries,
      selectCountry,
    }),
    [
      spiderApiKey,
      searchTerm,
      sortKey,
      sortDir,
      toggleSortDir,
      selectedCountry,
      balanceQuery,
      countriesQuery,
      filteredCountries,
      selectCountry,
    ],
  );
};

export { SORT_DIR, SORT_KEY, useSpiderCore };

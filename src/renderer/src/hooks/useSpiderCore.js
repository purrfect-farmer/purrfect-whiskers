import { useCallback, useMemo, useState } from "react";

import Spider from "../lib/Spider";
import { getCountry } from "../lib/countries";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useQuery } from "@tanstack/react-query";

/** Refresh interval of balance and stock while the dialog is open */
const REFRESH_INTERVAL = 60_000;

/** Spider group whose countries can be purchased */
const PURCHASABLE_GROUP = "1";

const SORT_KEY = Object.freeze({ NAME: "name", PRICE: "price" });
const SORT_DIR = Object.freeze({ ASC: "asc", DESC: "desc" });

/** Flattens Spider's grouped country prices into a list */
function parseCountries(data) {
  if (!data?.countries) return [];

  /* Quantities are returned under the misspelled "cuantity" key */
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
 * Spider balance, countries and country selection.
 * Requests only run while `active`, so a closed dialog does not poll.
 */
const useSpiderCore = ({ active }) => {
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState(SORT_KEY.NAME);
  const [sortDir, setSortDir] = useState(SORT_DIR.ASC);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const enabled = Boolean(spiderApiKey) && active;

  /* Balance Query */
  const balanceQuery = useQuery({
    queryKey: ["spider-balance", spiderApiKey],
    queryFn: () => new Spider(spiderApiKey).getBalance(),
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });

  /* Balance */
  const balance = balanceQuery.data?.wallet || 0;

  /* Countries Query */
  const countriesQuery = useQuery({
    queryKey: ["spider-countries", spiderApiKey],
    queryFn: () => new Spider(spiderApiKey).getCountries(),
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });

  /* Purchasable Countries */
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

  /* Filtered & Sorted Countries */
  const filteredCountries = useMemo(() => {
    const term = searchTerm.toLowerCase();
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

  /** Select Country */
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

  /** Toggle Sort Direction */
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

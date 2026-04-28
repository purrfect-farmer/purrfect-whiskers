import { useMemo, useState } from "react";

import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import { FaSpider } from "react-icons/fa";
import Spider from "../lib/Spider";
import SpiderAccountsForm from "./SpiderAccountsForm";
import SpiderBalanceDisplay from "./SpiderBalanceDisplay";
import SpiderCountries from "./SpiderCountries";
import SpiderKeyInput from "./SpiderKeyInput";
import { cn } from "../lib/utils";
import { getCountryData } from "countries-list";
import { getEmojiFlag } from "countries-list";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useQuery } from "@tanstack/react-query";

export default function SpiderDialog() {
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);

  const enabled = Boolean(spiderApiKey);

  /* Balance Query */
  const balanceQuery = useQuery({
    queryKey: ["spider-balance", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getBalance();
    },
    refetchInterval: 60_000,
    enabled,
  });

  /* Balance */
  const balance = balanceQuery.data?.wallet || 0;

  /* Countries Query */
  const countriesQuery = useQuery({
    queryKey: ["spider-countries", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getCountries();
    },
    refetchInterval: 60_000,
    enabled,
  });

  /* All Countries */
  const allCountries = useMemo(() => {
    try {
      return countriesQuery.data
        ? Object.entries(countriesQuery.data.countries).reduce(
            (result, [group, list]) =>
              result.concat(
                Object.entries(list).map(([code, price]) => {
                  const country = getCountryData(code);
                  const emoji = getEmojiFlag(code);
                  const name = country?.name || code;
                  return {
                    code,
                    price: parseFloat(price),
                    emoji,
                    name,
                    group,
                  };
                }),
              ),
            [],
          )
        : [];
    } catch (e) {
      console.error("Error processing countries:", e);
      return [];
    }
  }, [countriesQuery.data]);

  /* Available Countries (Group 1) */
  const availableCountries = useMemo(() => {
    return allCountries
      .filter((item) => item.group === "1")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allCountries]);

  /* Filtered Countries */
  const filteredCountries = useMemo(() => {
    return availableCountries.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [availableCountries, searchTerm]);

  /** Select Country */
  const selectCountry = (item) => {
    if (item.price > balance) {
      toast.error("Insufficient balance for this country.");
      return;
    }
    setSelectedCountry(item);
  };

  return (
    <AppDialogContent
      title={"Spider"}
      description={"Purchase accounts in bulk from Spider."}
      icon={FaSpider}
    >
      <SpiderKeyInput />

      {spiderApiKey ? (
        <>
          <SpiderBalanceDisplay query={balanceQuery} />
          {selectedCountry ? (
            <SpiderAccountsForm
              country={selectedCountry}
              clearSelection={() => setSelectedCountry(null)}
            />
          ) : (
            <>
              {countriesQuery.isSuccess ? (
                <SpiderCountries
                  selectCountry={selectCountry}
                  filteredCountries={filteredCountries}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              ) : countriesQuery.isPending ? (
                <p className="text-center">Loading countries...</p>
              ) : null}
              {/* Close Dialog */}
              <Dialog.Close
                className={cn(
                  "px-4 py-2.5 text-orange-500 border border-orange-500 rounded-xl",
                  "font-bold",
                )}
              >
                Close
              </Dialog.Close>
            </>
          )}
        </>
      ) : null}
    </AppDialogContent>
  );
}

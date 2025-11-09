import { FaSpider } from "react-icons/fa";
import AppDialogContent from "./AppDialogContent";
import useAppStore from "../store/useAppStore";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import Spider from "../lib/Spider";
import { getCountryData } from "countries-list";
import { getEmojiFlag } from "countries-list";
import SpiderCountries from "./SpiderCountries";
import SpiderBalanceDisplay from "./SpiderBalanceDisplay";
import SpiderKeyInput from "./SpiderKeyInput";
import SpiderAccountsForm from "./SpiderAccountsForm";

export default function SpiderDialog() {
  const spiderApiKey = useAppStore((state) => state.spiderApiKey);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);

  /* Balance Query */
  const balanceQuery = useQuery({
    queryKey: ["spider-balance", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getBalance();
    },
    enabled: Boolean(spiderApiKey),
  });

  /* Balance */
  const balance = balanceQuery.data?.wallet || 0;

  /* Countries Query */
  const countriesQuery = useQuery({
    queryKey: ["spider-countries", spiderApiKey],
    queryFn: async () => {
      return new Spider(spiderApiKey).getCountries();
    },
    enabled: Boolean(spiderApiKey),
  });

  /* All Countries */
  const allCountries = useMemo(() => {
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
              })
            ),
          []
        )
      : [];
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
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          ) : countriesQuery.isSuccess ? (
            <SpiderCountries
              selectCountry={selectCountry}
              filteredCountries={filteredCountries}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          ) : null}
        </>
      ) : null}
    </AppDialogContent>
  );
}

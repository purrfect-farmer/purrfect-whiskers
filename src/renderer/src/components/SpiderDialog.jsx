import ApiKeyInput from "./ApiKeyInput";
import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import { FaSpider } from "react-icons/fa";
import SpiderAccountsForm from "./SpiderAccountsForm";
import SpiderBalanceDisplay from "./SpiderBalanceDisplay";
import SpiderCountries from "./SpiderCountries";
import useAppStore from "../store/useAppStore";
import { useSpider } from "./SpiderProvider";

/** A dialog for buying accounts from Spider */
export default function SpiderDialog() {
  const { core } = useSpider();
  const setSpiderApiKey = useAppStore((state) => state.setSpiderApiKey);
  const {
    balanceQuery,
    spiderApiKey,
    searchTerm,
    setSearchTerm,
    sortKey,
    setSortKey,
    sortDir,
    toggleSortDir,
    selectedCountry,
    setSelectedCountry,
    countriesQuery,
    filteredCountries,
    selectCountry,
  } = core;

  return (
    <AppDialogContent
      title={"Spider"}
      description={"Purchase accounts in bulk from Spider."}
      icon={FaSpider}
    >
      <ApiKeyInput
        value={spiderApiKey}
        onSave={setSpiderApiKey}
        label="Spider API Key"
      />

      <p className="text-neutral-500 dark:text-neutral-400 text-center">
        Get your Spider API Key from the{" "}
        <a
          href="https://t.me/S_PIDERRBot?start=1147265290"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500"
        >
          Spider Bot
        </a>
        .
      </p>

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
                  sortKey={sortKey}
                  setSortKey={setSortKey}
                  sortDir={sortDir}
                  toggleSortDir={toggleSortDir}
                />
              ) : countriesQuery.isPending ? (
                <p className="text-center">Loading countries...</p>
              ) : countriesQuery.isError ? (
                <p className="text-center text-red-500">
                  Failed to load countries.
                </p>
              ) : null}

              <DialogCloseButton variant="outline" />
            </>
          )}
        </>
      ) : null}
    </AppDialogContent>
  );
}

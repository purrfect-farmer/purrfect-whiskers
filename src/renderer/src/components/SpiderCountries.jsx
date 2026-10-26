import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { SORT_DIR, SORT_KEY } from "../hooks/useSpiderCore";

import { cn } from "../lib/utils";
import IconButton from "./IconButton";
import Input from "./Input";
import Select from "./Select";

export default function SpiderCountries({
  selectCountry,
  filteredCountries,
  searchTerm,
  setSearchTerm,
  sortKey,
  setSortKey,
  sortDir,
  toggleSortDir,
}) {
  const ascending = sortDir === SORT_DIR.ASC;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="col-span-full font-bold text-center">All Countries</h2>
      <Input
        type="search"
        placeholder="Search countries..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
          <option value={SORT_KEY.NAME}>Sort by Name</option>
          <option value={SORT_KEY.PRICE}>Sort by Price</option>
        </Select>
        <IconButton
          onClick={toggleSortDir}
          title={ascending ? "Ascending" : "Descending"}
        >
          {ascending ? <FaSortAmountUp /> : <FaSortAmountDown />}
        </IconButton>
      </div>
      <div className="max-h-96 overflow-auto -mx-2 p-2">
        <div className="flex flex-col gap-2">
          {filteredCountries.map((item) => (
            <button
              type="button"
              key={`${item.group}-${item.code}`}
              onClick={() => selectCountry(item)}
              className={cn(
                "flex items-center gap-2",
                "p-2.5 text-left rounded-xl",
                "bg-neutral-100 dark:bg-neutral-700",
                "hover:bg-neutral-200 dark:hover:bg-neutral-600",
              )}
            >
              <span className="shrink-0">{item.emoji}</span>
              <span className="flex-1 min-w-0 font-bold truncate">
                {item.name}
              </span>
              <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                {item.quantity} left
              </span>
              <span className="shrink-0 font-bold text-orange-500">
                ${item.price}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

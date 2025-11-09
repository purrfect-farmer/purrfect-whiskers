import { cn } from "../lib/utils";
import Input from "./Input";

export default function SpiderCountries({
  selectCountry,
  filteredCountries,
  searchTerm,
  setSearchTerm,
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="col-span-full font-bold text-center">
        Available Countries
      </h2>
      <Input
        type="search"
        placeholder="Search countries..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="max-h-96 overflow-auto -mx-2 p-2">
        <div className="flex flex-col gap-2">
          {filteredCountries.map((item, index) => (
            <button
              key={index}
              onClick={() => selectCountry(item)}
              className={cn(
                "flex items-center gap-2",
                "p-2 text-left rounded-xl",
                "bg-neutral-700 hover:bg-neutral-600"
              )}
            >
              <span>{item.emoji}</span>
              <span className="flex-1 font-bold">{item.name}</span>
              <span>${item.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

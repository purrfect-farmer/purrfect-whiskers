import { cn } from "../lib/utils";

export default function ProxyCountryFilter({
  countries,
  total,
  activeCountry,
  onSelect,
}) {
  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {[{ code: null, name: "All", count: total }]
        .concat(countries)
        .map((country) => (
          <button
            key={country.code || "all"}
            title={country.name}
            onClick={() => onSelect(country.code)}
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
            <span className="font-bold">{country.code || country.name}</span>
            <span className="text-xs opacity-70">{country.count}</span>
          </button>
        ))}
    </div>
  );
}

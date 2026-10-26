import { getCountryData, getEmojiFlag } from "countries-list";

/** Resolved countries by upper-cased ISO code */
const countries = new Map();

/** Resolve country details from an ISO code */
export function getCountry(code) {
  if (!code) return null;

  /** The upper-cased ISO code */
  const upper = code.toUpperCase();

  if (!countries.has(upper)) {
    /** The country data of the code */
    const data = getCountryData(upper);

    countries.set(
      upper,
      data
        ? { code: upper, name: data.name, emoji: getEmojiFlag(upper) }
        : { code: upper, name: upper, emoji: null },
    );
  }

  return countries.get(upper);
}

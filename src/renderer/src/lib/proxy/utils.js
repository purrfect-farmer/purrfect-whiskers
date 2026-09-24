import { format, formatDistanceToNowStrict } from "date-fns";
import { getCountryData, getEmojiFlag } from "countries-list";

import toast from "react-hot-toast";

/** Resolve country details from an ISO code */
export function getCountry(code) {
  if (!code) return null;

  const upper = code.toUpperCase();
  const data = getCountryData(upper);

  return data
    ? { code: upper, name: data.name, emoji: getEmojiFlag(upper) }
    : { code: upper, name: upper, emoji: null };
}

/** Copy a value to the clipboard */
export async function copyText(value, label) {
  await navigator.clipboard.writeText(String(value));
  toast.success(`${label} copied!`);
}

/** Format a date with its relative time */
export function formatDateTime(value) {
  const date = new Date(value);
  return `${format(date, "PPpp")} (${formatDistanceToNowStrict(date, { addSuffix: true })})`;
}

/** Get Proxy URL */
export function getProxyUrl(proxy) {
  const auth = proxy.username
    ? `${proxy.username}:${proxy.password || ""}@`
    : "";

  return `http://${auth}${proxy.host}:${proxy.port}`;
}

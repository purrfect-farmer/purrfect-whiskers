import { format, formatDistanceToNowStrict } from "date-fns";

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

import { configureProxy } from "../lib/partitions";
import { useEffect } from "react";
import useSettingsStore from "../store/useSettingsStore";

/** A hook for applying an account's proxy and User-Agent to its session */
export default function useAccountProxy(account) {
  /** Whether proxies are allowed */
  const allowProxies = useSettingsStore((state) => state.allowProxies);
  const {
    partition,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
    userAgent,
  } = account;

  /** The proxy setup of the account's session */
  useEffect(() => {
    configureProxy(partition, {
      allowProxies,
      proxyEnabled,
      proxyHost,
      proxyPort,
      proxyUsername,
      proxyPassword,
      userAgent,
    });
  }, [
    partition,
    allowProxies,
    proxyEnabled,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyPassword,
    userAgent,
  ]);
}

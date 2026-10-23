import { configureProxy } from "../lib/partitions";
import { useEffect } from "react";
import useSettingsStore from "../store/useSettingsStore";

/** Applies the account's proxy and User-Agent to its session */
export default function useAccountProxy(account) {
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

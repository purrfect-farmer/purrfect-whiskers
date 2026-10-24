import { useMemo } from "react";
import { PROXY_PROVIDERS } from "../lib/proxy/ProxyManager";
import Tabs from "./Tabs";
import useAppStore from "../store/useAppStore";

/** The provider values, in the order the tabs show them */
const PROVIDER_VALUES = PROXY_PROVIDERS.map((provider) => provider.value);

/** Switching provider clears the proxies fetched from the previous one */
function changeProvider(provider) {
  const { proxyProvider, setProxyProvider, setProxies } =
    useAppStore.getState();

  if (provider === proxyProvider) return;

  setProxyProvider(provider);
  setProxies([]);
}

export default function ProxyProviderPicker({ disabled }) {
  const proxyProvider = useAppStore((state) => state.proxyProvider);

  const tabs = useMemo(
    () => ({
      list: PROVIDER_VALUES,
      rootProps: { value: proxyProvider, onValueChange: changeProvider },
    }),
    [proxyProvider],
  );

  return <Tabs tabs={tabs} disabled={disabled} />;
}

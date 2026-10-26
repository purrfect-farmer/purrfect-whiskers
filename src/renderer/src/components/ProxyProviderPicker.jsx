import { useMemo } from "react";
import { PROXY_PROVIDERS } from "../lib/proxy/ProxyManager";
import Tabs from "./Tabs";
import useAppStore from "../store/useAppStore";

/** The provider values, in the order the tabs show them */
const PROVIDER_VALUES = PROXY_PROVIDERS.map((provider) => provider.value);

/** The handler for changing the proxy provider */
function changeProvider(provider) {
  const { proxyProvider, setProxyProvider, setProxies } =
    useAppStore.getState();

  if (provider === proxyProvider) return;

  setProxyProvider(provider);
  setProxies([]);
}

/** A tab list for picking the proxy provider */
export default function ProxyProviderPicker({ disabled }) {
  const proxyProvider = useAppStore((state) => state.proxyProvider);

  /** The provider tabs */
  const tabs = useMemo(
    () => ({
      list: PROVIDER_VALUES,
      rootProps: { value: proxyProvider, onValueChange: changeProvider },
    }),
    [proxyProvider],
  );

  return <Tabs tabs={tabs} disabled={disabled} />;
}

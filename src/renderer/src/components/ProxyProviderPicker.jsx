import { PROXY_PROVIDERS } from "../lib/proxy/ProxyManager";
import SectionLabel from "./SectionLabel";
import SegmentedControl from "./SegmentedControl";
import useAppStore from "../store/useAppStore";

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

  return (
    <>
      <SectionLabel>Provider</SectionLabel>
      <SegmentedControl
        options={PROXY_PROVIDERS}
        value={proxyProvider}
        onChange={changeProvider}
        disabled={disabled}
      />
    </>
  );
}

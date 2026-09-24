import { PROXY_PROVIDERS } from "../lib/proxy/ProxyManager";
import { cn } from "../lib/utils";
import useAppStore from "../store/useAppStore";

export default function ProxyProviderPicker({ disabled }) {
  const proxyProvider = useAppStore((state) => state.proxyProvider);
  const setProxyProvider = useAppStore((state) => state.setProxyProvider);
  const setProxies = useAppStore((state) => state.setProxies);

  /** Change Provider */
  const changeProvider = (provider) => {
    if (provider === proxyProvider) return;
    setProxyProvider(provider);
    setProxies([]);
  };

  return (
    <>
      <label className="text-orange-500 mt-2">Provider</label>
      <div className="grid grid-cols-2 gap-2">
        {PROXY_PROVIDERS.map((item) => (
          <button
            key={item.value}
            onClick={() => changeProvider(item.value)}
            disabled={disabled}
            className={cn(
              proxyProvider === item.value && "text-orange-500",
              "bg-neutral-100 dark:bg-neutral-700",
              "p-2 rounded-xl",
              "flex gap-1 items-center justify-center",
              "uppercase font-bold",
              "disabled:opacity-50",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

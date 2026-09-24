import ProxyManager, { PROXY_PROVIDERS } from "../lib/proxy/ProxyManager";
import { useState } from "react";

import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import Input from "./Input";
import { LuGlobeLock } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import ProxyList from "./ProxyList";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useMutation } from "@tanstack/react-query";
import useSettingsStore from "../store/useSettingsStore";

export default function ProxiesDialog() {
  const accounts = useAppStore((state) => state.accounts);
  const proxies = useAppStore((state) => state.proxies);
  const proxyProvider = useAppStore((state) => state.proxyProvider);
  const proxyApiKey = useAppStore((state) => state.proxyApiKey);
  const setProxies = useAppStore((state) => state.setProxies);
  const setProxyProvider = useAppStore((state) => state.setProxyProvider);
  const setProxyApiKey = useAppStore((state) => state.setProxyApiKey);
  const applyProxies = useAppStore((state) => state.applyProxies);
  const allowProxies = useSettingsStore((state) => state.allowProxies);

  const [tempApiKey, setTempApiKey] = useState(proxyApiKey || "");

  /** Fetch Proxies */
  const fetchMutation = useMutation({
    mutationKey: ["proxies", proxyProvider],
    mutationFn: () =>
      new ProxyManager({
        provider: proxyProvider,
        apiKey: proxyApiKey,
      }).getProxies(),
    onSuccess: (list) => {
      setProxies(list);
      toast.success(`Fetched ${list.length} proxies!`);
    },
    onError: (error) => {
      toast.error(`Failed to fetch proxies: ${error.message}`);
    },
  });

  /** Change Provider */
  const changeProvider = (provider) => {
    if (provider === proxyProvider) return;
    setProxyProvider(provider);
    setProxies([]);
  };

  /** Save API Key */
  const saveApiKey = () => {
    setProxyApiKey(tempApiKey.trim() || null);
    toast.success("Proxy API Key saved!");
  };

  /** Apply Proxies */
  const handleApplyProxies = () => {
    applyProxies(
      accounts.map((item) => item.partition),
      proxies,
    );
    toast.success(`Applied proxies to ${accounts.length} account(s)!`);
  };

  return (
    <AppDialogContent
      title={"Proxies"}
      description={"Fetch proxies from a provider and apply them to accounts."}
      icon={LuGlobeLock}
    >
      {/* Provider */}
      <label className="text-orange-500 mt-2">Provider</label>
      <div className="grid grid-cols-2 gap-2">
        {PROXY_PROVIDERS.map((item) => (
          <button
            key={item.value}
            onClick={() => changeProvider(item.value)}
            disabled={fetchMutation.isPending}
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

      {/* API Key */}
      <div className="flex gap-2">
        <Input
          value={tempApiKey}
          onChange={(e) => setTempApiKey(e.target.value)}
          placeholder="Enter your API Key"
        />

        <button
          className={cn(
            "px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600",
            "shrink-0 rounded-xl font-bold",
          )}
          onClick={saveApiKey}
        >
          Save
        </button>
      </div>

      {/* Fetch Proxies */}
      <PrimaryButton
        onClick={() => fetchMutation.mutate()}
        disabled={!proxyApiKey || fetchMutation.isPending}
      >
        {fetchMutation.isPending ? "Fetching..." : "Fetch Proxies"}
      </PrimaryButton>

      {/* Proxy List */}
      <ProxyList proxies={proxies} />

      {/* Allow Proxies Warning */}
      {!allowProxies ? (
        <Alert variant={"warning"}>
          Proxies won&apos;t take effect until Allow Proxies is enabled in
          Settings.
        </Alert>
      ) : null}

      {/* Apply Proxies */}
      <PrimaryButton
        onClick={handleApplyProxies}
        disabled={proxies.length === 0 || accounts.length === 0}
      >
        Apply Proxies
      </PrimaryButton>

      {/* Close Dialog */}
      <Dialog.Close
        className={cn(
          "px-4 py-2.5 text-orange-500 border border-orange-500 rounded-xl",
          "font-bold",
        )}
      >
        Close
      </Dialog.Close>
    </AppDialogContent>
  );
}

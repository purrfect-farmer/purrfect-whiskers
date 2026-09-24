import Alert from "./Alert";
import AppDialogContent from "./AppDialogContent";
import { Dialog } from "radix-ui";
import { LuGlobeLock } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import ProxyKeyInput from "./ProxyKeyInput";
import ProxyList from "./ProxyList";
import ProxyManager from "../lib/proxy/ProxyManager";
import ProxyProviderPicker from "./ProxyProviderPicker";
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
  const applyProxies = useAppStore((state) => state.applyProxies);
  const allowProxies = useSettingsStore((state) => state.allowProxies);

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
      <ProxyProviderPicker disabled={fetchMutation.isPending} />

      {/* API Key */}
      <ProxyKeyInput />

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

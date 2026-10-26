import { ALERT_VARIANT } from "../lib/constants";
import Alert from "./Alert";
import ApiKeyInput from "./ApiKeyInput";
import AppDialogContent from "./AppDialogContent";
import DialogCloseButton from "./DialogCloseButton";
import { LuGlobeLock } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import ProxyList from "./ProxyList";
import ProxyManager from "../lib/proxy/ProxyManager";
import ProxyProviderPicker from "./ProxyProviderPicker";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useMutation } from "@tanstack/react-query";
import useSettingsStore from "../store/useSettingsStore";

/** Assigns the fetched proxies to every account, in order */
function applyProxiesToAccounts() {
  const { accounts, proxies, applyProxies } = useAppStore.getState();

  applyProxies(
    accounts.map((item) => item.partition),
    proxies,
  );
  toast.success(`Applied proxies to ${accounts.length} account(s)!`);
}

/** A dialog for fetching and applying proxies */
export default function ProxiesDialog() {
  const hasAccounts = useAppStore((state) => state.accounts.length > 0);
  const proxies = useAppStore((state) => state.proxies);
  const proxyProvider = useAppStore((state) => state.proxyProvider);
  const proxyApiKey = useAppStore((state) => state.proxyApiKey);
  const setProxies = useAppStore((state) => state.setProxies);
  const setProxyApiKey = useAppStore((state) => state.setProxyApiKey);
  const allowProxies = useSettingsStore((state) => state.allowProxies);

  /** The mutation for fetching proxies from the provider */
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

  return (
    <AppDialogContent
      title={"Proxies"}
      description={"Fetch proxies from a provider and apply them to accounts."}
      icon={LuGlobeLock}
    >
      {/* Provider */}
      <ProxyProviderPicker disabled={fetchMutation.isPending} />

      {/* API Key */}
      <ApiKeyInput
        value={proxyApiKey}
        onSave={setProxyApiKey}
        label="Proxy API Key"
      />

      {/* Fetch Proxies */}
      <PrimaryButton
        variant="neutral"
        onClick={() => fetchMutation.mutate()}
        disabled={!proxyApiKey || fetchMutation.isPending}
      >
        {fetchMutation.isPending ? "Fetching..." : "Fetch Proxies"}
      </PrimaryButton>

      {/* Proxy List */}
      <ProxyList proxies={proxies} />

      {/* Allow Proxies Warning */}
      {!allowProxies ? (
        <Alert variant={ALERT_VARIANT.WARNING}>
          Proxies won&apos;t take effect until Allow Proxies is enabled in
          Settings.
        </Alert>
      ) : null}

      {/* Apply Proxies */}
      <PrimaryButton
        onClick={applyProxiesToAccounts}
        disabled={proxies.length === 0 || !hasAccounts}
      >
        Apply Proxies
      </PrimaryButton>

      <DialogCloseButton variant="outline" />
    </AppDialogContent>
  );
}

import Input from "./Input";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import useAppStore from "../store/useAppStore";
import { useState } from "react";

export default function ProxyKeyInput() {
  const proxyApiKey = useAppStore((state) => state.proxyApiKey);
  const setProxyApiKey = useAppStore((state) => state.setProxyApiKey);

  const [tempApiKey, setTempApiKey] = useState(proxyApiKey || "");

  /** Save API Key */
  const handleSave = () => {
    setProxyApiKey(tempApiKey.trim() || null);
    toast.success("Proxy API Key saved!");
  };

  return (
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
        onClick={handleSave}
      >
        Save
      </button>
    </div>
  );
}

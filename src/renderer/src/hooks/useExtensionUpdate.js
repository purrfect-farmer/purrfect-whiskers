import { updateExtension } from "../lib/extensionUpdate";
import { useEffect } from "react";
import useSettingsStore from "../store/useSettingsStore";

/** A hook for updating the extension when auto-update is on */
export default function useExtensionUpdate() {
  /** Whether the extension updates automatically */
  const autoUpdateExtension = useSettingsStore(
    (state) => state.autoUpdateExtension,
  );
  /** The path of the extension */
  const extensionPath = useSettingsStore((state) => state.extensionPath);

  /** The silent update of the extension */
  useEffect(() => {
    if (extensionPath && autoUpdateExtension) {
      updateExtension({ silent: true });
    }
  }, [extensionPath, autoUpdateExtension]);
}

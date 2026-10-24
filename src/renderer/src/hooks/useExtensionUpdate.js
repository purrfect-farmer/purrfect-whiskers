import { updateExtension } from "../lib/extensionUpdate";
import { useEffect } from "react";
import useSettingsStore from "../store/useSettingsStore";

/** Checks for a newer extension when auto-update is on */
export default function useExtensionUpdate() {
  const autoUpdateExtension = useSettingsStore(
    (state) => state.autoUpdateExtension,
  );
  const extensionPath = useSettingsStore((state) => state.extensionPath);

  useEffect(() => {
    if (extensionPath && autoUpdateExtension) {
      updateExtension({ silent: true });
    }
  }, [extensionPath, autoUpdateExtension]);
}

import { IPC } from "../../../shared/constants/ipc";
import { useEffect } from "react";
import useSettingsStore from "../store/useSettingsStore";

export default function useExtensionUpdate() {
  const autoUpdateExtension = useSettingsStore(
    (state) => state.autoUpdateExtension,
  );
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const setExtensionPath = useSettingsStore((state) => state.setExtensionPath);

  useEffect(() => {
    if (!extensionPath) {
      window.electron.ipcRenderer
        .invoke(IPC.GET_DEFAULT_EXTENSION_PATH)
        .then(setExtensionPath);
    } else if (autoUpdateExtension) {
      window.electron.ipcRenderer
        .invoke(IPC.UPDATE_EXTENSION, extensionPath)
        .then((result) => {
          console.log("Extension Update Result:", result);
        });
    }
  }, [extensionPath, autoUpdateExtension, setExtensionPath]);
}

import { useEffect } from "react";

import useSettingsStore from "../store/useSettingsStore";

export default function useExtensionUpdate() {
  const extensionPath = useSettingsStore((state) => state.extensionPath);
  const setExtensionPath = useSettingsStore((state) => state.setExtensionPath);

  useEffect(() => {
    if (!extensionPath) {
      window.electron.ipcRenderer
        .invoke("get-default-extension-path")
        .then((path) => {
          setExtensionPath(path);
        });
    } else {
      window.electron.ipcRenderer
        .invoke("update-extension", extensionPath)
        .then((result) => {});
    }
  }, [extensionPath, setExtensionPath]);
}

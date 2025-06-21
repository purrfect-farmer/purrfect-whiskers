import { useEffect } from "react";

export default function useWebviewNewWindow(ref, isReady, addTab) {
  /** Capture New Window */
  useEffect(() => {
    if (isReady) {
      const webview = ref.current;
      const id = webview.getWebContentsId();

      window.electron.ipcRenderer.invoke("enable-new-window-capture", id);

      return () =>
        window.electron.ipcRenderer.invoke("cancel-new-window-capture", id);
    }
  }, [isReady]);

  /** Handle New Window Open */
  useEffect(() => {
    if (isReady) {
      const webview = ref.current;
      const webContentsId = webview.getWebContentsId();

      /** Listen for Window Open */
      const listener = (ev, args) => {
        const { id, action, data } = args;
        if (id === webContentsId) {
          switch (action) {
            case "open-window":
              addTab(data);
              break;
          }
        }
      };

      /** Add Listener */
      window.electron.ipcRenderer.on("browser-message", listener);

      return () => {
        /** Remove Listener */
        window.electron.ipcRenderer.removeListener("browser-message", listener);
      };
    }
  }, [isReady, addTab]);
}

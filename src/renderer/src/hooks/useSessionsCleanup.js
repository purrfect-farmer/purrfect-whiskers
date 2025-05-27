import { useEffect } from "react";

export default function useSessionsCleanup() {
  useEffect(() => {
    const handler = () => {
      window.electron.ipcRenderer.invoke("close-all-sessions");
    };
    window.addEventListener("beforeunload", handler);

    return () => window.removeEventListener("beforeunload", handler);
  }, []);
}

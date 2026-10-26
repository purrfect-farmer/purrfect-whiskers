import { IPC } from "../../../shared/constants/ipc";
import { useQuery } from "@tanstack/react-query";

/** A hook for the OS name, architecture and release format of this install */
export default function useSystemInfo() {
  return useQuery({
    queryKey: ["system-info"],
    queryFn: () => window.electron.ipcRenderer.invoke(IPC.GET_SYSTEM_INFO),
    staleTime: Infinity,
  });
}

import { useMutation, useQuery } from "@tanstack/react-query";

import { IPC } from "../../../shared/constants/ipc";
import { getErrorMessage } from "../lib/utils";
import toast from "react-hot-toast";

/** The empty list of scripts */
const NO_SCRIPTS = [];

/** A hook for the scripts in a folder and installing new ones */
export default function useScriptPackages(folder, onInstalled) {
  /** The scripts in the folder, with their manifest details */
  const scriptsQuery = useQuery({
    queryKey: ["scripts", folder],
    queryFn: () => window.electron.ipcRenderer.invoke(IPC.LIST_SCRIPTS, folder),
    enabled: folder !== "",
  });

  /** The install of a script package chosen from a zip */
  const installMutation = useMutation({
    mutationFn: () =>
      window.electron.ipcRenderer.invoke(IPC.INSTALL_SCRIPT, folder),
    onSuccess: async (result) => {
      if (result.canceled) return;

      await scriptsQuery.refetch();
      onInstalled(result.name);
      toast.success("Script installed!");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return {
    scripts: scriptsQuery.data ?? NO_SCRIPTS,
    isLoading: scriptsQuery.isFetching,
    refresh: scriptsQuery.refetch,
    install: installMutation.mutate,
    isInstalling: installMutation.isPending,
  };
}

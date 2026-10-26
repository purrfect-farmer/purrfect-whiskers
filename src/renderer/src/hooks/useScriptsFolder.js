import { IPC } from "../../../shared/constants/ipc";
import { useQuery } from "@tanstack/react-query";
import useSettingsStore from "../store/useSettingsStore";

/** A hook for the scripts folder in use: the chosen one, or the default */
export default function useScriptsFolder() {
  const scriptsFolder = useSettingsStore((state) => state.scriptsFolder);

  /** Whether no folder is chosen, so the default is used */
  const isDefault = scriptsFolder === "";

  /** The default scripts folder, created on first use */
  const defaultQuery = useQuery({
    queryKey: ["default-scripts-folder"],
    queryFn: () =>
      window.electron.ipcRenderer.invoke(IPC.GET_DEFAULT_SCRIPTS_FOLDER),
    enabled: isDefault,
    staleTime: Infinity,
  });

  /** The folder in use */
  const folder = isDefault ? (defaultQuery.data ?? "") : scriptsFolder;

  return { folder, isDefault };
}

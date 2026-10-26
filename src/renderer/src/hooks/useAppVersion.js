import { IPC } from "../../../shared/constants/ipc";
import axios from "axios";
import { getGithubHeaders } from "../../../shared/lib/github";
import semver from "semver";
import { useQuery } from "@tanstack/react-query";

/** A hook for the installed version and the latest release */
export default function useAppVersion() {
  /** The query of the installed version */
  const currentQuery = useQuery({
    queryKey: ["app-version"],
    queryFn: () =>
      window.electron.ipcRenderer
        .invoke(IPC.GET_APP_VERSION)
        .then((version) => "v" + version),
    staleTime: Infinity,
  });

  /** The query of the latest release */
  const latestQuery = useQuery({
    queryKey: ["app-latest-release"],
    queryFn: () =>
      axios
        .get(import.meta.env.VITE_APP_RELEASE_API_URL, {
          headers: getGithubHeaders(),
        })
        .then((res) => res.data["tag_name"]),
    staleTime: Infinity,
    retry: false,
  });

  /** The installed version */
  const currentVersion = currentQuery.data ?? null;
  /** The latest release version */
  const latestVersion = latestQuery.data ?? null;

  /** Whether a newer release is available */
  const hasUpdate = Boolean(
    semver.valid(currentVersion) &&
    semver.valid(latestVersion) &&
    semver.gt(latestVersion, currentVersion),
  );

  return { currentVersion, latestVersion, hasUpdate };
}

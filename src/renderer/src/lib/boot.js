import { IPC } from "../../../shared/constants/ipc";
import { installLatestExtension } from "./extensionUpdate";
import useSettingsStore from "../store/useSettingsStore";

/** Invoke a main process handler */
const invoke = (channel, ...args) =>
  window.electron.ipcRenderer.invoke(channel, ...args);

/** The stored extension path, set to the default when there is none */
export async function resolveExtensionPath() {
  const { extensionPath, setExtensionPath } = useSettingsStore.getState();

  if (extensionPath) return extensionPath;

  const defaultPath = await invoke(IPC.GET_DEFAULT_EXTENSION_PATH);
  setExtensionPath(defaultPath);

  return defaultPath;
}

/** Install the latest extension when none is installed, resolving whether one is */
export async function ensureExtension(extensionPath) {
  if (await invoke(IPC.GET_EXTENSION_VERSION, extensionPath)) return true;

  await installLatestExtension(extensionPath);

  return Boolean(await invoke(IPC.GET_EXTENSION_VERSION, extensionPath));
}

/** Download the User-Agent catalog when missing, resolving whether one is available */
export function ensureUserAgents(extensionPath) {
  return invoke(IPC.SYNC_USER_AGENTS, extensionPath);
}

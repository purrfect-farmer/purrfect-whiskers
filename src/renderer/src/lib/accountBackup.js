import {
  BACKUP_ATTEMPT_INTERVAL,
  MAX_BACKUP_ATTEMPTS,
  WEBVIEWS_CONTAINER_ID,
} from "./constants";
import {
  configureProxy,
  createWebview,
  getWhiskerData,
  pickProxyOptions,
  registerWebviewMessage,
  sendHostMessage,
} from "./partitions";

import { WEBVIEW_ACTION } from "../../../shared/constants/ipc";
import useSettingsStore from "../store/useSettingsStore";

/**
 * Loads an account in a hidden webview, then collects its backup data,
 * or restores `backup` into it when one is given.
 * The webview is recreated every BACKUP_ATTEMPT_INTERVAL until it answers,
 * and the promise rejects after MAX_BACKUP_ATTEMPTS.
 * @param {object} account
 * @param {object|null} backup
 */
export async function getOrRestoreAccountBackup(account, backup = null) {
  const { partition, userAgent } = account;
  const { extensionPath, theme } = useSettingsStore.getState();

  await configureProxy(partition, {
    ...pickProxyOptions(account),
    allowProxies: false,
  });

  const container = document.getElementById(WEBVIEWS_CONTAINER_ID);

  return new Promise((resolve, reject) => {
    let attempts = 0;
    let webview = null;
    let unsubscribe = null;
    let interval = null;

    const removeWebview = () => {
      unsubscribe?.();
      webview?.remove();
    };

    const finish = () => {
      clearInterval(interval);
      removeWebview();
    };

    const handleResponse = (data) => {
      finish();
      resolve(data);
    };

    const handlers = {
      [WEBVIEW_ACTION.GET_WHISKER_DATA]: () => {
        sendHostMessage(webview, {
          action: WEBVIEW_ACTION.SET_WHISKER_DATA,
          data: getWhiskerData({
            account,
            settings: { allowProxies: false, theme },
          }),
        });

        sendHostMessage(
          webview,
          backup
            ? { action: WEBVIEW_ACTION.RESTORE_BACKUP_DATA, data: backup }
            : { action: WEBVIEW_ACTION.GET_BACKUP_DATA },
        );
      },
      [WEBVIEW_ACTION.SET_PROXY]: (data) => {
        configureProxy(partition, { ...data, userAgent, allowProxies: false });
      },
      [WEBVIEW_ACTION.RESPONSE_GET_BACKUP_DATA]: handleResponse,
      [WEBVIEW_ACTION.RESPONSE_RESTORE_BACKUP_DATA]: handleResponse,
    };

    const attempt = () => {
      if (attempts >= MAX_BACKUP_ATTEMPTS) {
        finish();
        reject(new Error(`No response from account "${account.title}"`));
        return;
      }

      attempts += 1;
      removeWebview();

      webview = createWebview(partition, extensionPath);
      unsubscribe = registerWebviewMessage(webview, handlers);
      container.appendChild(webview);
    };

    interval = setInterval(attempt, BACKUP_ATTEMPT_INTERVAL);
    attempt();
  });
}

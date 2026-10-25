import {
  MAX_WEBVIEW_ATTEMPTS,
  WEBVIEWS_CONTAINER_ID,
  WEBVIEW_ATTEMPT_INTERVAL,
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
import { holdPartitions } from "./busyPartitions";
import useSettingsStore from "../store/useSettingsStore";

/**
 * Runs `converse(ask)` in a hidden webview of the account, recreating the
 * webview whenever it makes no progress for WEBVIEW_ATTEMPT_INTERVAL.
 */
function runConversation(account, converse) {
  const { partition, userAgent } = account;
  const { extensionPath, theme } = useSettingsStore.getState();
  const container = document.getElementById(WEBVIEWS_CONTAINER_ID);

  return new Promise((resolve, reject) => {
    let attempts = 0;
    let webview = null;
    let unsubscribe = null;
    let timer = null;
    let settled = false;

    const removeWebview = () => {
      unsubscribe?.();
      webview?.remove();
    };

    const finish = () => {
      settled = true;
      clearTimeout(timer);
      removeWebview();
    };

    /** Recreate the webview unless it makes progress in time */
    const armRetry = () => {
      clearTimeout(timer);
      timer = setTimeout(attempt, WEBVIEW_ATTEMPT_INTERVAL);
    };

    const attempt = () => {
      if (attempts >= MAX_WEBVIEW_ATTEMPTS) {
        finish();
        reject(new Error(`No response from account "${account.title}"`));
        return;
      }

      attempts += 1;
      removeWebview();

      const current = createWebview(partition, extensionPath);
      const isCurrent = () => !settled && webview === current;
      let started = false;

      /** Replies are routed by action, so each ask adds its own handler */
      const handlers = {};

      const ask = (message, responseAction) =>
        new Promise((answer) => {
          if (!isCurrent()) return;

          handlers[responseAction] = (data) => {
            delete handlers[responseAction];
            armRetry();
            answer(data);
          };

          sendHostMessage(current, message);
        });

      handlers[WEBVIEW_ACTION.GET_WHISKER_DATA] = () => {
        if (started) return;
        started = true;
        armRetry();

        sendHostMessage(current, {
          action: WEBVIEW_ACTION.SET_WHISKER_DATA,
          data: getWhiskerData({
            account,
            settings: { allowProxies: false, theme },
          }),
        });

        Promise.resolve(converse(ask)).then(
          (result) => {
            if (!isCurrent()) return;
            finish();
            resolve(result);
          },
          (error) => {
            if (!isCurrent()) return;
            finish();
            reject(error);
          },
        );
      };

      handlers[WEBVIEW_ACTION.SET_PROXY] = (data) => {
        configureProxy(partition, { ...data, userAgent, allowProxies: false });
      };

      webview = current;
      unsubscribe = registerWebviewMessage(current, handlers);
      container.appendChild(current);
      armRetry();
    };

    attempt();
  });
}

/**
 * Loads an account in a hidden webview with proxies off and, once the
 * farmer asks for its data, resolves with `converse(ask)`.
 * `ask(message, responseAction)` sends a message and resolves with the reply.
 * A webview with no progress for WEBVIEW_ATTEMPT_INTERVAL is recreated and
 * the conversation starts over; the promise rejects after MAX_WEBVIEW_ATTEMPTS.
 * The partition counts as busy until it settles, so it cannot be opened.
 * @param {object} account
 * @param {(ask: Function) => Promise<any>} converse
 */
export async function converseWithAccount(account, converse) {
  const release = holdPartitions([account.partition]);

  try {
    await configureProxy(account.partition, {
      ...pickProxyOptions(account),
      allowProxies: false,
    });

    return await runConversation(account, converse);
  } finally {
    release();
  }
}

/** Sends one message to an account's farmer and resolves with its reply */
export function requestAccountWebview(account, message, responseAction) {
  return converseWithAccount(account, (ask) => ask(message, responseAction));
}

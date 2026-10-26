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

/** Runs `converse(ask)` in a hidden webview, recreating it when stalled */
function runConversation(account, converse) {
  const { partition, userAgent } = account;
  const { extensionPath, theme } = useSettingsStore.getState();
  /** The element holding the hidden webviews */
  const container = document.getElementById(WEBVIEWS_CONTAINER_ID);

  return new Promise((resolve, reject) => {
    /** The number of webviews created */
    let attempts = 0;
    /** The current webview */
    let webview = null;
    /** Removes the message listener of the current webview */
    let unsubscribe = null;
    /** The retry timer */
    let timer = null;
    /** Whether the conversation has finished */
    let settled = false;

    /** Removes the current webview */
    const removeWebview = () => {
      unsubscribe?.();
      webview?.remove();
    };

    /** Ends the conversation and removes the webview */
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

    /** Creates a webview and starts the conversation in it */
    const attempt = () => {
      if (attempts >= MAX_WEBVIEW_ATTEMPTS) {
        finish();
        reject(new Error(`No response from account "${account.title}"`));
        return;
      }

      attempts += 1;
      removeWebview();

      /** The webview of this attempt */
      const current = createWebview(partition, extensionPath);
      /** Whether this attempt is still the live one */
      const isCurrent = () => !settled && webview === current;
      /** Whether the conversation has started */
      let started = false;

      /** The message handlers by action */
      const handlers = {};

      /** Sends a message and resolves with its reply */
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

      /** Starts the conversation once the farmer asks for its data */
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

      /** Applies the proxy the farmer sets */
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
 * Runs `converse(ask)` with an account in a hidden webview, proxies off;
 * `ask(message, responseAction)` resolves with the reply
 * @param {object} account
 * @param {(ask: Function) => Promise<any>} converse
 */
export async function converseWithAccount(account, converse) {
  /** Releases the account's partition */
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

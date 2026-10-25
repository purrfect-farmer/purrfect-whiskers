import { SESSION_STATUS } from "../../../shared/constants/sessionStatus";
import { WEBVIEW_ACTION } from "../../../shared/constants/ipc";
import { converseWithAccount } from "./accountWebview";

const KNOWN_STATUSES = new Set(Object.values(SESSION_STATUS));

const SESSION_STATUS_REQUEST = { action: WEBVIEW_ACTION.GET_SESSION_STATUS };
const BACKUP_REQUEST = { action: WEBVIEW_ACTION.GET_BACKUP_DATA };

/** Ask a farmer for its session status, anything unknown is an error */
async function askSessionStatus(ask) {
  const status = await ask(
    SESSION_STATUS_REQUEST,
    WEBVIEW_ACTION.RESPONSE_GET_SESSION_STATUS,
  );

  return KNOWN_STATUSES.has(status) ? status : SESSION_STATUS.ERROR;
}

/** Asks an account's farmer whether its Telegram session is signed in */
export async function getAccountSessionStatus(account) {
  try {
    return await converseWithAccount(account, askSessionStatus);
  } catch (error) {
    console.error(error);

    return SESSION_STATUS.NO_RESPONSE;
  }
}

/**
 * Checks the session again and backs the account up in the same visit,
 * unless it is active now. Resolves with `{ status, backup }`.
 */
export function backupAccountUnlessActive(account) {
  return converseWithAccount(account, async (ask) => {
    const status = await askSessionStatus(ask);

    if (status === SESSION_STATUS.ACTIVE) {
      return { status, backup: null };
    }

    const backup = await ask(
      BACKUP_REQUEST,
      WEBVIEW_ACTION.RESPONSE_GET_BACKUP_DATA,
    );

    return { status, backup };
  });
}

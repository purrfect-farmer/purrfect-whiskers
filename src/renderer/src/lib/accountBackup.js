import { WEBVIEW_ACTION } from "../../../shared/constants/ipc";
import { requestAccountWebview } from "./accountWebview";

/**
 * Collects an account's backup data,
 * or restores `backup` into it when one is given.
 * @param {object} account
 * @param {object|null} backup
 */
export function getOrRestoreAccountBackup(account, backup = null) {
  return backup
    ? requestAccountWebview(
        account,
        { action: WEBVIEW_ACTION.RESTORE_BACKUP_DATA, data: backup },
        WEBVIEW_ACTION.RESPONSE_RESTORE_BACKUP_DATA,
      )
    : requestAccountWebview(
        account,
        { action: WEBVIEW_ACTION.GET_BACKUP_DATA },
        WEBVIEW_ACTION.RESPONSE_GET_BACKUP_DATA,
      );
}

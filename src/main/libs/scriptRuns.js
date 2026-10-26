import { SCRIPT_API, SCRIPT_NOTIFY_TYPE } from "../../shared/constants/ipc";
import { checkRequestArgs } from "./scriptRequestArgs";

/** The known request methods */
const API_METHODS = new Set(Object.values(SCRIPT_API));

/** The requests about one of the run's accounts, named by the first argument */
const ACCOUNT_REQUESTS = new Set([
  SCRIPT_API.GET_SESSION,
  SCRIPT_API.GET_BACKUP,
  SCRIPT_API.GET_ACCOUNT,
  SCRIPT_API.UPDATE_ACCOUNT,
  SCRIPT_API.RESTORE_BACKUP,
  SCRIPT_API.OPEN_ACCOUNT,
  SCRIPT_API.CLOSE_ACCOUNT,
]);

/** The accounts of a run from untrusted input */
export function toRunAccounts(raw) {
  const isValid =
    Array.isArray(raw) &&
    raw.every(
      (account) =>
        account &&
        typeof account === "object" &&
        typeof account.partition === "string",
    );

  if (!isValid) throw new Error("Invalid accounts");

  return raw;
}

/** The renderer's answer to a request from untrusted input, or null */
export function toResponse(raw) {
  if (!raw || typeof raw !== "object" || !Number.isInteger(raw.id)) {
    return null;
  }

  return {
    id: raw.id,
    result: raw.result,
    error: typeof raw.error === "string" ? raw.error : undefined,
  };
}

/** The longest status line or notification kept */
const MAX_MESSAGE_LENGTH = 300;

/** The known notification types */
const NOTIFY_TYPES = new Set(Object.values(SCRIPT_NOTIFY_TYPE));

/** A short message from untrusted input, or null */
const toMessage = (value) =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim().slice(0, MAX_MESSAGE_LENGTH)
    : null;

/** A script's status line from untrusted input, or null to clear it */
export const toStatusText = toMessage;

/** A script's notification from untrusted input */
export function toNotification(message) {
  return {
    text: toMessage(message?.text) ?? "",
    kind: NOTIFY_TYPES.has(message?.kind)
      ? message.kind
      : SCRIPT_NOTIFY_TYPE.INFO,
  };
}

/** A whole, non-negative count from untrusted input */
export function toCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/** A script's request made safe to forward, or the error to answer it with */
export function checkRequest({ id, method, args }, partitions) {
  if (!API_METHODS.has(method)) {
    return { error: `Unknown request: ${String(method)}` };
  }

  /** The request's arguments */
  const params = Array.isArray(args) ? args : [];

  if (ACCOUNT_REQUESTS.has(method) && !partitions.has(params[0])) {
    return { error: "The account is not part of this run" };
  }

  /** The checked arguments, or the error refusing them */
  const checked = checkRequestArgs(method, params, partitions);

  if (checked.error) return { error: checked.error };

  return {
    request: {
      id,
      method,
      args: checked.args,
      expiresAt: checked.expiresAt ?? null,
    },
  };
}

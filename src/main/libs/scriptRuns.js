import { SCRIPT_API } from "../../shared/constants/ipc";
import { normalizePrompt } from "../../shared/lib/scriptPrompts";

/** The known request methods */
const API_METHODS = new Set(Object.values(SCRIPT_API));

/** The requests that read one of the run's accounts */
const ACCOUNT_REQUESTS = new Set([
  SCRIPT_API.GET_SESSION,
  SCRIPT_API.GET_BACKUP,
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

  if (method !== SCRIPT_API.PROMPT) {
    return { request: { id, method, args: params.slice(0, 1) } };
  }

  /** The prompt with only valid properties */
  const prompt = normalizePrompt(params[0]);

  if (prompt.partition !== null && !partitions.has(prompt.partition)) {
    return { error: "The account is not part of this run" };
  }

  /** The time the prompt closes by itself, or null */
  const expiresAt = prompt.timeout ? Date.now() + prompt.timeout * 1000 : null;

  return { request: { id, method, args: [prompt], expiresAt } };
}

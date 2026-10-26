import { IPC } from "../../../shared/constants/ipc";
import { clsx } from "clsx";
import { formatDate } from "date-fns";
import pMap from "p-map";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";
export { v4 as uuid } from "uuid";

/** Merges class names, resolving Tailwind conflicts */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Runs `task` on every item, at most `limit` at a time, in order
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @param {(results: R[]) => void} [onBatch]
 * @returns {Promise<R[]>}
 */
export async function runWithLimit(items, limit, task, onBatch) {
  /** The finished results not yet passed to `onBatch` */
  let batch = [];

  /** Passes the finished results to `onBatch` */
  const flush = () => {
    if (batch.length === 0) return;

    onBatch?.(batch);
    batch = [];
  };

  const results = await pMap(
    items,
    async (item) => {
      const result = await task(item);

      batch.push(result);
      if (batch.length >= limit) flush();

      return result;
    },
    { concurrency: limit },
  );

  flush();

  return results;
}

/** Saves data as a timestamped JSON file in the backup folder */
export function saveJsonFile(prefix, data) {
  /** The current time for the file name */
  const timestamp = formatDate(new Date(), "yyyyMMdd-HHmmss");

  return window.electron.ipcRenderer.invoke(
    IPC.SAVE_BACKUP_FILE,
    `${prefix}-${timestamp}.json`,
    JSON.stringify(data, null, 2),
  );
}

/** Reads a dropped file as JSON */
export async function readJsonFile(file) {
  return JSON.parse(await file.text());
}

/** Copy a value to the clipboard */
export async function copyText(value, label) {
  await navigator.clipboard.writeText(String(value));
  toast.success(`${label} copied!`);
}

/** A field with a null or undefined value as "" */
export function safeField(field) {
  return {
    ...field,
    value: field.value ?? "",
  };
}

/** The full name of a Telegram user */
export function getTelegramUserFullName(user) {
  return [user["first_name"], user["last_name"]].filter(Boolean).join(" ");
}

/** Parses an init data string with its user */
export function extractInitDataUnsafe(initData) {
  const parsedInitData = Object.fromEntries(
    new URLSearchParams(initData).entries(),
  );

  return {
    ...parsedInitData,
    user: JSON.parse(parsedInitData.user),
  };
}

/** Parse the Telegram user of an init data string, or null */
export function parseTelegramUser(initData) {
  try {
    return initData ? extractInitDataUnsafe(initData)["user"] : null;
  } catch {
    return null;
  }
}

/** The parsed Telegram user of each account object */
const telegramUsers = new WeakMap();

/** The Telegram user of an account, parsed once */
export function getTelegramUser(account) {
  if (!account) return null;

  if (!telegramUsers.has(account)) {
    telegramUsers.set(account, parseTelegramUser(account.telegramInitData));
  }

  return telegramUsers.get(account);
}

/** Whether an account has a Telegram user with an id */
export function hasTelegramUser(account) {
  return getTelegramUser(account)?.["id"] != null;
}

/** Whether an account's title or Telegram user matches the search */
export function matchesSearch(search, item) {
  /** The Telegram user of the account */
  const user = getTelegramUser(item);

  const fullName = user ? getTelegramUserFullName(user) : "";
  const username = user?.["username"] || "";
  const userId = user?.["id"] || "";

  /** The search in lower case */
  const query = search.toLowerCase();

  /** Whether a value includes the search, ignoring case */
  const includes = (value) => value.toString().toLowerCase().includes(query);

  return (
    includes(item.title) ||
    includes(fullName) ||
    includes(username) ||
    includes(userId)
  );
}

/** The prefix Electron adds to errors thrown by IPC handlers */
const IPC_ERROR_PREFIX = /^Error invoking remote method '[^']+': (Error: )?/;

/** The message of an error, without Electron's IPC prefix */
export function getErrorMessage(error) {
  return String(error?.message ?? error).replace(IPC_ERROR_PREFIX, "");
}

/** The formatter of counts, with thousands separators */
const NUMBER_FORMAT = new Intl.NumberFormat();

/** A count with thousands separators */
export function formatNumber(value) {
  return NUMBER_FORMAT.format(value);
}

/** A number of seconds as m:ss, or h:mm:ss from an hour */
export function formatDuration(totalSeconds) {
  /** The whole hours */
  const hours = Math.floor(totalSeconds / 3600);
  /** The minutes past the hours */
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  /** The seconds past the minutes, as two digits */
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

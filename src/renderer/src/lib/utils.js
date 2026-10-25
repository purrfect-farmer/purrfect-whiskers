import { IPC } from "../../../shared/constants/ipc";
import { clsx } from "clsx";
import { formatDate } from "date-fns";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";
export { v4 as uuid } from "uuid";

/** Class Names */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Chunk Array Generator */
export function* chunkArrayGenerator(arr, size) {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

/**
 * Runs `task` on every item, `size` items at a time
 * @template T, R
 * @param {T[]} items
 * @param {number} size
 * @param {(item: T) => Promise<R>} task
 * @param {(results: R[]) => void} [onChunk] Called after each chunk
 * @returns {Promise<R[]>}
 */
export async function runInChunks(items, size, task, onChunk) {
  const results = [];

  for (const chunk of chunkArrayGenerator(items, size)) {
    const chunkResults = await Promise.all(chunk.map(task));

    onChunk?.(chunkResults);
    results.push(...chunkResults);
  }

  return results;
}

/** Saves data as a timestamped JSON file in the backup folder */
export function saveJsonFile(prefix, data) {
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

/** Safe Field — normalizes null/undefined field values to "" for controlled inputs */
export function safeField(field) {
  return {
    ...field,
    value: field.value ?? "",
  };
}

/** Get Telegram User Full Name */
export function getTelegramUserFullName(user) {
  return [user["first_name"], user["last_name"]].filter(Boolean).join(" ");
}

/** Search Includes */
export function searchIncludes(value, search) {
  return value.toString().toLowerCase().includes(search.toLowerCase());
}

/** Extract InitDataUnsafe */
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

/** Parsed users per account object; an edited account is a new object */
const telegramUsers = new WeakMap();

/** Get Account Telegram User */
export function getTelegramUser(account) {
  if (!account) return null;

  if (!telegramUsers.has(account)) {
    telegramUsers.set(account, parseTelegramUser(account.telegramInitData));
  }

  return telegramUsers.get(account);
}

export function matchesSearch(search, item) {
  const user = getTelegramUser(item);

  const fullName = user ? getTelegramUserFullName(user) : "";
  const username = user?.["username"] || "";
  const userId = user?.["id"] || "";

  return (
    searchIncludes(item.title, search) ||
    searchIncludes(fullName, search) ||
    searchIncludes(username, search) ||
    searchIncludes(userId, search)
  );
}

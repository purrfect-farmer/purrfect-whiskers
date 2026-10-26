import { LAUNCH_ERROR } from "./constants";
import { findAccountsByTelegramIds } from "./telegramAccounts";
import { getTelegramUser } from "./utils";

/** The most Telegram ids one request may look up */
const MAX_TELEGRAM_IDS = 5000;

/** The longest requester title a pick request may show */
const MAX_PICK_TITLE_LENGTH = 100;

/** An account as the farmer receives it */
export function toFarmerAccount(account) {
  const user = getTelegramUser(account) || {};

  return {
    partition: account.partition,
    title: account.title,
    userId: user["id"],
    firstName: user["first_name"] || "",
    lastName: user["last_name"] || "",
    username: user["username"] || "",
    tags: Array.isArray(account.tags) ? account.tags : [],
  };
}

/** The Telegram ids of a lookup request, or null when the request is malformed */
export function readTelegramIds(data) {
  const ids = data?.["telegramUserIds"];

  if (!Array.isArray(ids) || ids.length > MAX_TELEGRAM_IDS) return null;

  return ids.map((id) => String(id ?? "").trim()).filter(Boolean);
}

/** The reply to a lookup request: the accounts of the Telegram ids that matched */
export function lookupFarmerAccounts(accounts, data) {
  const ids = readTelegramIds(data);

  if (!ids) return { error: LAUNCH_ERROR.INVALID_REQUEST };

  return {
    accounts: findAccountsByTelegramIds(accounts, ids).map(toFarmerAccount),
  };
}

/** The requester title of a pick request, empty when missing or malformed */
export function readPickTitle(data) {
  const title = data?.["title"];

  return typeof title === "string"
    ? title.trim().slice(0, MAX_PICK_TITLE_LENGTH)
    : "";
}

/** The account picker source of a farmer's webview */
export function farmerPickerSource(partition) {
  return `farmer:${partition}`;
}

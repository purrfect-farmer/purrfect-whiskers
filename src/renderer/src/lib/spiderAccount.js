import { uuid } from "./utils";

/** Extension storage keys of the default farmer account */
const STORAGE_KEY = Object.freeze({
  ACCOUNTS: "shared:accounts",
  LOCAL_TELEGRAM_SESSION: "account-default:local-telegram-session",
  SETTINGS: "account-default:settings",
});

/** Mirror command that switches the farmer to Telegram Web K */
export const OPEN_TELEGRAM_WEB_COMMAND = Object.freeze({
  action: "core.set-active-tab",
  data: ["telegram-web-k"],
});

/** Builds the Whiskers account for the purchase at position `index` */
export function buildSpiderAccount({
  purchase,
  index,
  titlePrefix,
  startNumber,
  tags,
}) {
  return {
    partition: `persist:${uuid()}`,
    title: titlePrefix
      ? `${titlePrefix}${startNumber + index}`
      : `Spider ${purchase.account["phone"]}`,
    tags: [...tags],
  };
}

/** Builds the backup that signs a new account in to Telegram Web */
export function buildSpiderBackup({ account, purchase }) {
  const { enableLocalTelegramSession, localTelegramSession } = purchase;

  const chromeLocalStorage = {
    [STORAGE_KEY.ACCOUNTS]: [
      { id: "default", partition: account.partition, title: account.title },
    ],
  };

  if (enableLocalTelegramSession) {
    chromeLocalStorage[STORAGE_KEY.LOCAL_TELEGRAM_SESSION] =
      localTelegramSession;
    chromeLocalStorage[STORAGE_KEY.SETTINGS] = {
      farmerMode: "session",
      onboarded: true,
    };
  }

  return {
    data: {
      telegramWebLocalStorage: purchase.telegramWebLocalStorage,
      chromeLocalStorage,
    },
  };
}

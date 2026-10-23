export const MAX_CONCURRENT_BACKUPS = Math.max(
  navigator.hardwareConcurrency || 1,
  3,
);

/** Attempts to load a backup webview before giving up, 30s each */
export const MAX_BACKUP_ATTEMPTS = 5;
export const BACKUP_ATTEMPT_INTERVAL = 30_000;

/** Element holding the hidden webviews used for backups */
export const WEBVIEWS_CONTAINER_ID = "webviews-container";

/** How long an account flashes after being asked to open */
export const FLASH_DURATION = 3000;

export const THEME = Object.freeze({
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
});

export const REORDER_MODE = Object.freeze({
  VIRTUAL: "virtual",
  DRAG: "drag",
});

export const PROXY_PROVIDER = Object.freeze({
  WEBSHARE: "webshare",
  FLOXY: "floxy",
});

/** Errors returned to a launch-account request */
export const LAUNCH_ERROR = Object.freeze({
  INVALID_REQUEST: "INVALID_REQUEST",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
});

/** Strategies for logging in to Telegram locally */
export const SPIDER_LOGIN_METHOD = Object.freeze({
  AUTO: "auto",
  TOKEN: "token",
  CODE: "code",
});

/** Fields holding an account's proxy and User-Agent options */
export const PROXY_OPTION_KEYS = Object.freeze([
  "proxyEnabled",
  "proxyHost",
  "proxyPort",
  "proxyUsername",
  "proxyPassword",
  "userAgent",
]);

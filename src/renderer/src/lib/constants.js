/** Hidden account webviews loaded at once */
export const MAX_CONCURRENT_WEBVIEWS = Math.max(
  navigator.hardwareConcurrency || 1,
  3,
);

/** Attempts to load a hidden webview, each ends after 30s without progress */
export const MAX_WEBVIEW_ATTEMPTS = 5;
export const WEBVIEW_ATTEMPT_INTERVAL = 30_000;

/** Element holding the hidden account webviews */
export const WEBVIEWS_CONTAINER_ID = "webviews-container";

/** An account's border blinks this many times after being asked to open */
export const FLASH_BLINKS = 6;
export const FLASH_BLINK_DURATION = 160;
export const FLASH_DURATION = FLASH_BLINKS * FLASH_BLINK_DURATION;

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

/** Tabs of the Bulk Edit dialog */
export const BULK_EDIT_TAB = Object.freeze({
  RENAME: "rename",
  TAGS: "tags",
});

/** Tabs of the Cleaner dialog */
export const CLEANER_TAB = Object.freeze({
  ACCOUNTS: "accounts",
  TAGS: "tags",
});

/** Errors returned to a launch-account request */
export const LAUNCH_ERROR = Object.freeze({
  INVALID_REQUEST: "INVALID_REQUEST",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  ACCOUNT_BUSY: "ACCOUNT_BUSY",
});

/** Strategies for logging in to Telegram locally */
export const SPIDER_LOGIN_METHOD = Object.freeze({
  AUTO: "auto",
  TOKEN: "token",
  CODE: "code",
});

/** Fields holding an account's proxy */
export const PROXY_KEYS = Object.freeze([
  "proxyEnabled",
  "proxyHost",
  "proxyPort",
  "proxyUsername",
  "proxyPassword",
]);

/** Fields holding an account's proxy and User-Agent options */
export const PROXY_OPTION_KEYS = Object.freeze([...PROXY_KEYS, "userAgent"]);

/** Downloads the app checks for before it opens */
export const BOOT_STEP = Object.freeze({
  EXTENSION: "extension",
  USER_AGENTS: "user-agents",
});

export const BOOT_STATUS = Object.freeze({
  PENDING: "pending",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
});

export const EXTENSION_UPDATE_STATUS = Object.freeze({
  IDLE: "idle",
  CHECKING: "checking",
  DOWNLOADING: "downloading",
  UP_TO_DATE: "up-to-date",
  UPDATED: "updated",
  FAILED: "failed",
});

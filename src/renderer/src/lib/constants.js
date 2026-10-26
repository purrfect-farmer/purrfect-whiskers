/** Hidden account webviews loaded at once */
export const MAX_CONCURRENT_WEBVIEWS = Math.max(
  navigator.hardwareConcurrency || 1,
  3,
);

/** The most attempts to load a hidden webview */
export const MAX_WEBVIEW_ATTEMPTS = 5;
/** How long an attempt waits for progress */
export const WEBVIEW_ATTEMPT_INTERVAL = 30_000;

/** Element holding the hidden account webviews */
export const WEBVIEWS_CONTAINER_ID = "webviews-container";

/** The number of blinks of an account's flash */
export const FLASH_BLINKS = 6;
/** The duration of one blink */
export const FLASH_BLINK_DURATION = 160;
/** The duration of the whole flash */
export const FLASH_DURATION = FLASH_BLINKS * FLASH_BLINK_DURATION;

/** The app themes */
export const THEME = Object.freeze({
  SYSTEM: "system",
  LIGHT: "light",
  DARK: "dark",
});

/** Extension storage keys of the default farmer account */
export const FARMER_STORAGE_KEY = Object.freeze({
  ACCOUNTS: "shared:accounts",
  LOCAL_TELEGRAM_SESSION: "account-default:local-telegram-session",
  SETTINGS: "account-default:settings",
});

/** The states of a script run */
export const SCRIPT_STATUS = Object.freeze({
  IDLE: "idle",
  RUNNING: "running",
  STOPPING: "stopping",
  DONE: "done",
  FAILED: "failed",
  STOPPED: "stopped",
});

/** Where an account's Telegram session came from */
export const SESSION_SOURCE = Object.freeze({
  LOCAL: "local",
  WEB: "web",
});

/** The most log lines a script run keeps */
export const MAX_SCRIPT_LOG_LINES = 5_000;

/** The ways of reordering accounts */
export const REORDER_MODE = Object.freeze({
  VIRTUAL: "virtual",
  DRAG: "drag",
});

/** The proxy providers */
export const PROXY_PROVIDER = Object.freeze({
  WEBSHARE: "webshare",
  FLOXY: "floxy",
});

/** The tabs of the Bulk Edit dialog */
export const BULK_EDIT_TAB = Object.freeze({
  RENAME: "rename",
  TAGS: "tags",
  DELETE: "delete",
});

/** The tabs of the Cleaner dialog */
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

/** The statuses of a boot step */
export const BOOT_STATUS = Object.freeze({
  PENDING: "pending",
  RUNNING: "running",
  DONE: "done",
  FAILED: "failed",
});

/** The statuses of an extension update */
export const EXTENSION_UPDATE_STATUS = Object.freeze({
  IDLE: "idle",
  CHECKING: "checking",
  DOWNLOADING: "downloading",
  UP_TO_DATE: "up-to-date",
  UPDATED: "updated",
  FAILED: "failed",
});

/** The colours of a section badge */
export const BADGE_TONE = Object.freeze({
  NEUTRAL: "neutral",
  ORANGE: "orange",
  BLUE: "blue",
  GREEN: "green",
  RED: "red",
  PURPLE: "purple",
});

/** The kinds of alert */
export const ALERT_VARIANT = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  DANGER: "danger",
  SUCCESS: "success",
});

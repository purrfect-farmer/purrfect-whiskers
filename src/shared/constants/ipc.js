/** Channels handled by the main process (`ipcMain.handle`) */
export const IPC = Object.freeze({
  GET_APP_VERSION: "get-app-version",
  GET_SYSTEM_INFO: "get-system-info",
  GET_SESSION_COOKIE: "get-session-cookie",
  SET_SESSION_COOKIE: "set-session-cookie",
  UPDATE_DECLARATIVE_NET_RULES: "update-declarative-net-rules",
  SAVE_BACKUP_FILE: "save-backup-file",
  OPEN_PATH: "open-path",
  INSTALL_EXTENSION: "install-extension",
  CHECK_EXTENSION_UPDATE: "check-extension-update",
  INSTALL_LATEST_EXTENSION: "install-latest-extension",
  GET_EXTENSION_VERSION: "get-extension-version",
  GET_DEFAULT_EXTENSION_PATH: "get-default-extension-path",
  PICK_EXTENSION_PATH: "pick-extension-path",
  CONFIGURE_PROXY: "configure-proxy",
  SETUP_SESSION: "setup-session",
  REMOVE_SESSION: "remove-session",
  CONFIGURE_THEME: "configure-theme",
  GENERATE_USER_AGENT: "generate-user-agent",
  SYNC_USER_AGENTS: "sync-user-agents",
  GET_DEFAULT_SCRIPTS_FOLDER: "get-default-scripts-folder",
  PICK_SCRIPTS_FOLDER: "pick-scripts-folder",
  LIST_SCRIPTS: "list-scripts",
  RUN_SCRIPT: "run-script",
  STOP_SCRIPT: "stop-script",
  INSTALL_SCRIPT: "install-script",
  GET_SCRIPT_RUN: "get-script-run",
  OPEN_SCRIPT_FOLDER: "open-script-folder",
  SCRIPT_RESPONSE: "script-response",
  PICK_SCRIPT_PATH: "pick-script-path",
});

/** The channel carrying script run events from the main process */
export const SCRIPT_CHANNEL = "script-event";

/** The events of a script run, sent to the renderer */
export const SCRIPT_EVENT = Object.freeze({
  OUTPUT: "output",
  REQUEST: "request",
  PROMPT_CLOSED: "prompt-closed",
  SHOW_PROMPT: "show-prompt",
  PROGRESS: "progress",
  STATUS: "status",
  NOTIFY: "notify",
  STOPPING: "stopping",
  DONE: "done",
  ERROR: "error",
  EXIT: "exit",
  STOPPED: "stopped",
});

/** The messages between the main process and a script's process */
export const SCRIPT_HOST_MESSAGE = Object.freeze({
  START: "start",
  RESPONSE: "response",
  ABORT: "abort",
  REQUEST: "request",
  PROGRESS: "progress",
  STATUS: "status",
  NOTIFY: "notify",
  DONE: "done",
  ERROR: "error",
});

/** The requests a script can make to the app */
export const SCRIPT_API = Object.freeze({
  GET_SESSION: "getSession",
  GET_BACKUP: "getBackup",
  GET_TAGS: "getTags",
  PROMPT: "prompt",
  GET_ACCOUNT: "getAccount",
  UPDATE_ACCOUNT: "updateAccount",
  RESTORE_BACKUP: "restoreBackup",
  ADD_ACCOUNT: "addAccount",
  OPEN_ACCOUNT: "openAccount",
  CLOSE_ACCOUNT: "closeAccount",
  CREATE_TAG: "createTag",
  STORAGE_GET: "storageGet",
  STORAGE_SET: "storageSet",
});

/** The requests a script's storage answers in the main process */
export const SCRIPT_STORAGE_API = Object.freeze([
  SCRIPT_API.STORAGE_GET,
  SCRIPT_API.STORAGE_SET,
]);

/** The kinds of message a script can show as a toast */
export const SCRIPT_NOTIFY_TYPE = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  ERROR: "error",
});

/** Channels between the host page and its webviews */
export const WEBVIEW_CHANNEL = Object.freeze({
  /** Host page → webview */
  HOST_MESSAGE: "host-message",

  /** Webview → host page */
  WEBVIEW_MESSAGE: "webview-message",

  /** Main process → host page */
  BROWSER_MESSAGE: "browser-message",
});

/** Actions carried by webview channel messages */
export const WEBVIEW_ACTION = Object.freeze({
  GET_WHISKER_DATA: "get-whisker-data",
  SET_WHISKER_DATA: "set-whisker-data",
  SET_PROXY: "set-proxy",
  SET_USER_AGENT: "set-user-agent",
  SET_TELEGRAM_INIT_DATA: "set-telegram-init-data",
  LAUNCH_ACCOUNT: "launch-account",
  RESPONSE_LAUNCH_ACCOUNT: "response-launch-account",
  GET_BACKUP_DATA: "get-backup-data",
  RESPONSE_GET_BACKUP_DATA: "response-get-backup-data",
  RESTORE_BACKUP_DATA: "restore-backup-data",
  RESPONSE_RESTORE_BACKUP_DATA: "response-restore-backup-data",
  GET_SESSION_STATUS: "get-session-status",
  RESPONSE_GET_SESSION_STATUS: "response-get-session-status",
  OPEN_WINDOW: "open-window",
});

/** Mirror socket events and rooms */
export const MIRROR = Object.freeze({
  PORT: 7777,
  ROOM_RECEIVERS: "receivers",
  EVENT_MESSAGE: "message",
  EVENT_COMMAND: "command",
});

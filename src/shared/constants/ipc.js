/** Channels handled by the main process (`ipcMain.handle`) */
export const IPC = Object.freeze({
  GET_APP_VERSION: "get-app-version",
  GET_SESSION_COOKIE: "get-session-cookie",
  SET_SESSION_COOKIE: "set-session-cookie",
  UPDATE_DECLARATIVE_NET_RULES: "update-declarative-net-rules",
  SAVE_BACKUP_FILE: "save-backup-file",
  OPEN_PATH: "open-path",
  INSTALL_EXTENSION: "install-extension",
  UPDATE_EXTENSION: "update-extension",
  GET_EXTENSION_VERSION: "get-extension-version",
  GET_DEFAULT_EXTENSION_PATH: "get-default-extension-path",
  PICK_EXTENSION_PATH: "pick-extension-path",
  CONFIGURE_PROXY: "configure-proxy",
  SETUP_SESSION: "setup-session",
  REMOVE_SESSION: "remove-session",
  CONFIGURE_THEME: "configure-theme",
  GENERATE_USER_AGENT: "generate-user-agent",
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
  SET_TELEGRAM_INIT_DATA: "set-telegram-init-data",
  LAUNCH_ACCOUNT: "launch-account",
  RESPONSE_LAUNCH_ACCOUNT: "response-launch-account",
  GET_BACKUP_DATA: "get-backup-data",
  RESPONSE_GET_BACKUP_DATA: "response-get-backup-data",
  RESTORE_BACKUP_DATA: "restore-backup-data",
  RESPONSE_RESTORE_BACKUP_DATA: "response-restore-backup-data",
  OPEN_WINDOW: "open-window",
});

/** Mirror socket events and rooms */
export const MIRROR = Object.freeze({
  PORT: 7777,
  ROOM_RECEIVERS: "receivers",
  EVENT_MESSAGE: "message",
  EVENT_COMMAND: "command",
});

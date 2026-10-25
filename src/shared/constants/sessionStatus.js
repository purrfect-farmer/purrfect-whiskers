/** What a Telegram session check found for an account */
export const SESSION_STATUS = Object.freeze({
  ACTIVE: "active",
  NO_SESSION: "no-session",
  LOGGED_OUT: "logged-out",
  DEACTIVATED: "deactivated",
  ERROR: "error",

  /** The account's webview never answered */
  NO_RESPONSE: "no-response",
});

import devicesList from "./devices.json";
import { randomItem } from "./utils";

export const devices = Object.entries(devicesList).map(([key, value]) => ({
  model: key,
  ...value,
}));

/* Android version → SDK level */
export const androidVersions = [
  { version: "11", sdk: 30 },
  { version: "12", sdk: 31 },
  { version: "13", sdk: 33 },
  { version: "14", sdk: 34 },
  { version: "15", sdk: 35 },
  { version: "16", sdk: 36 },
];

/* Telegram versions */
export const telegramVersions = [
  "11.5.3",
  "11.6.1",
  "11.7.0",
  "11.8.1",
  "12.0.0",
  "12.1.0",
  "12.2.1",
  "12.3.0",
  "12.4.1",
  "12.5.2",
];

/* Quality flag */
export const qualities = ["HIGH", "MEDIUM"];

export function getRandomDevice() {
  const quality = randomItem(qualities);
  const telegramVersion = randomItem(telegramVersions);
  const androidVersion = randomItem(androidVersions);
  const device = randomItem(devices);
  return { quality, telegramVersion, androidVersion, device };
}

/** Matches a "/x.y.z" version token and the space after it */
const VERSION_PATTERN = "/\\d+\\.\\d+\\.\\d+\\s*";
const ELECTRON_TOKEN_REGEX = new RegExp("Electron" + VERSION_PATTERN);
const PLATFORM_REGEX = /\([^)]+\) AppleWebKit/;

/** App token regexes, built once per app name */
const appTokenRegexes = new Map();

function getAppTokenRegex(appName) {
  if (!appTokenRegexes.has(appName)) {
    const escapedName = appName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    appTokenRegexes.set(appName, new RegExp(escapedName + VERSION_PATTERN));
  }

  return appTokenRegexes.get(appName);
}

/**
 * Turns a desktop Electron User-Agent into a Telegram-Android one:
 * strips the app and Electron tokens, swaps the platform for Android,
 * marks Safari as mobile and appends the Telegram-Android suffix.
 * @param {string} baseUserAgent
 * @param {string} appName
 * @param {ReturnType<typeof getRandomDevice>} traits
 */
export function buildTelegramUserAgent(
  baseUserAgent,
  appName,
  traits = getRandomDevice(),
) {
  const { androidVersion, device, quality, telegramVersion } = traits;
  const android = androidVersion.version;

  let userAgent = baseUserAgent
    .replace(getAppTokenRegex(appName), "")
    .replace(ELECTRON_TOKEN_REGEX, "")
    .trim();

  if (!userAgent.includes("Android")) {
    userAgent = userAgent.replace(
      PLATFORM_REGEX,
      `(Linux; Android ${android}; K) AppleWebKit`,
    );
  }

  if (!userAgent.includes("Mobile Safari")) {
    userAgent = userAgent.replace("Safari", "Mobile Safari");
  }

  if (!userAgent.includes("Telegram-Android")) {
    const details = [
      device.name,
      `Android ${android}`,
      `SDK ${androidVersion.sdk}`,
      quality,
    ].join("; ");

    userAgent = `${userAgent} Telegram-Android/${telegramVersion} (${details})`;
  }

  return userAgent;
}

import devicesList from "./devices.json";
import { randomItem } from "./utils";

export const devices = Object.entries(devicesList).map(([key, value]) => ({
  model: key,
  ...value,
}));

/* Android version → SDK (weighted toward 13/14) */
export const androidVersions = [
  { version: "11", sdk: 30 },
  { version: "12", sdk: 32 },
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

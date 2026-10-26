import { APP_PACKAGE } from "../../../shared/constants/appPackage";

/** The operating systems Whiskers is released for */
export const APP_PLATFORM = Object.freeze({
  WINDOWS: "win32",
  MAC: "darwin",
  LINUX: "linux",
});

/** The display name of each operating system */
const PLATFORM_NAMES = {
  [APP_PLATFORM.WINDOWS]: "Windows",
  [APP_PLATFORM.MAC]: "macOS",
  [APP_PLATFORM.LINUX]: "Linux",
};

/** The file name pattern of each release format */
const PACKAGE_PATTERNS = {
  [APP_PACKAGE.EXE]: /-setup\.exe$/,
  [APP_PACKAGE.DMG]: /\.dmg$/,
  [APP_PACKAGE.APPIMAGE]: /\.AppImage$/,
  [APP_PACKAGE.PACMAN]: /\.pacman$/,
  [APP_PACKAGE.DEB]: /\.deb$/,
  [APP_PACKAGE.RPM]: /\.rpm$/,
};

/** The operating system Whiskers runs on */
export const CURRENT_PLATFORM = window.electron.process.platform;

/** The display name of this computer's operating system */
export const CURRENT_PLATFORM_NAME = PLATFORM_NAMES[CURRENT_PLATFORM] ?? null;

/** The website section listing every download */
export const WEBSITE_DOWNLOADS_URL =
  import.meta.env.VITE_APP_WEBSITE_URL + "/#download";

/** The formatter of release dates, e.g. "Oct 26, 2026" */
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

/** The formatter of file sizes in megabytes */
const sizeFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

/** A release file from untrusted API data, or null */
function toAsset(raw) {
  if (!raw || typeof raw !== "object") return null;

  const { name, browser_download_url: url, size } = raw;

  if (typeof name !== "string" || typeof url !== "string") return null;
  if (!url.startsWith("https://github.com/")) return null;

  return { name, url, size: typeof size === "number" ? size : 0 };
}

/** The latest release from untrusted API data */
export function toAppRelease(data) {
  if (!data || typeof data.tag_name !== "string") {
    throw new Error("The release has no version");
  }

  /** The publish date, or null when missing or invalid */
  const publishedAt = new Date(data.published_at);

  return {
    version: data.tag_name,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? null : publishedAt,
    assets: Array.isArray(data.assets)
      ? data.assets.map(toAsset).filter(Boolean)
      : [],
  };
}

/** The release file in a given format, or null */
export function findAppDownload(release, packageFormat) {
  /** The file name pattern of the format */
  const pattern = PACKAGE_PATTERNS[packageFormat];

  return pattern
    ? (release.assets.find((asset) => pattern.test(asset.name)) ?? null)
    : null;
}

/** A release date for display */
export const formatReleaseDate = (date) => dateFormatter.format(date);

/** A file size for display, e.g. "155 MB", kept on one line */
export const formatFileSize = (bytes) =>
  `${sizeFormatter.format(bytes / 1_000_000)} MB`;

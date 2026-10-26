import { APP_PACKAGE } from "../../shared/constants/appPackage";
import os from "node:os";
import { readFile } from "node:fs/promises";

/** The file describing the Linux distro */
const OS_RELEASE_PATH = "/etc/os-release";

/** The only architecture Whiskers is built for on Linux */
const LINUX_ARCH = "x64";

/** The Linux distro families and their package format, checked in order */
const DISTRO_PACKAGES = [
  [/\bsteamos\b/, APP_PACKAGE.APPIMAGE],
  [
    /\b(arch|manjaro|endeavouros|garuda|cachyos|artix|arcolinux)\b/,
    APP_PACKAGE.PACMAN,
  ],
  [/\b(debian|ubuntu)\b/, APP_PACKAGE.DEB],
  [/\b(fedora|rhel|centos|suse|opensuse)\b/, APP_PACKAGE.RPM],
];

/** The fields of /etc/os-release, or {} when it can't be read */
async function readOsRelease() {
  try {
    /** The file's text */
    const text = await readFile(OS_RELEASE_PATH, "utf8");

    return Object.fromEntries(
      text
        .split("\n")
        .map((line) => line.match(/^([A-Z_]+)=(.*)$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
    );
  } catch {
    return {};
  }
}

/** The release format this install came from, or null when unknown */
function detectPackage(osRelease) {
  switch (process.platform) {
    case "win32":
      return APP_PACKAGE.EXE;
    case "darwin":
      return APP_PACKAGE.DMG;
    case "linux": {
      if (process.arch !== LINUX_ARCH) return null;
      if (process.env.APPIMAGE) return APP_PACKAGE.APPIMAGE;

      /** The distro and the distros it's based on */
      const ids = `${osRelease.ID ?? ""} ${osRelease.ID_LIKE ?? ""}`;
      const match = DISTRO_PACKAGES.find(([pattern]) =>
        pattern.test(ids.toLowerCase()),
      );

      return match ? match[1] : null;
    }
    default:
      return null;
  }
}

/** The system info, read on first use */
let systemInfo = null;

/** The OS name, architecture and release format of this install */
export function getSystemInfo() {
  systemInfo ??= readOsRelease().then((osRelease) => ({
    os: osRelease.PRETTY_NAME || `${os.type()} ${os.release()}`,
    arch: process.arch,
    package: detectPackage(osRelease),
  }));

  return systemInfo;
}

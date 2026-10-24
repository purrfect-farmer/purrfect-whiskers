import { withChromeVersion } from "../../../shared/lib/userAgent";

/** The User-Agent naming Whisker's Chrome version */
export function withWhiskerChromeVersion(userAgent) {
  return withChromeVersion(userAgent, window.electron.process.versions.chrome);
}

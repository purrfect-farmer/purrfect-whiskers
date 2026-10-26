import {
  APP_PLATFORM,
  CURRENT_PLATFORM,
  CURRENT_PLATFORM_NAME,
  WEBSITE_DOWNLOADS_URL,
  findAppDownload,
  formatFileSize,
  formatReleaseDate,
} from "../lib/appRelease";
import { memo, useMemo } from "react";

import MacOpenFix from "./MacOpenFix";
import useSystemInfo from "../hooks/useSystemInfo";
import { MdOutlineBrowserUpdated } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import { cn } from "../lib/utils";

/** A card offering the latest release when the app is out of date */
export default memo(function AppUpdateCard({ currentVersion, release }) {
  /** The release format of this install, or null */
  const packageFormat = useSystemInfo().data?.package ?? null;

  /** The release file for this computer, or null */
  const download = useMemo(
    () => findAppDownload(release, packageFormat),
    [release, packageFormat],
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MdOutlineBrowserUpdated className="size-5 shrink-0 text-orange-500" />
        <div className="flex flex-col min-w-0">
          <h4 className="font-bold">A new version is available</h4>
          <p className="text-neutral-500 dark:text-neutral-400">
            {currentVersion} → {release.version}
            {release.publishedAt
              ? ` · ${formatReleaseDate(release.publishedAt)}`
              : null}
          </p>
        </div>
      </div>

      {/* Download */}
      <PrimaryButton
        as="a"
        target="_blank"
        href={download?.url ?? WEBSITE_DOWNLOADS_URL}
      >
        {download
          ? `Download ${release.version} for ${CURRENT_PLATFORM_NAME}`
          : `Get ${release.version}`}
        {download?.size ? ` (${formatFileSize(download.size)})` : null}
      </PrimaryButton>

      {/* Other Downloads */}
      {download ? (
        <a
          target="_blank"
          href={WEBSITE_DOWNLOADS_URL}
          className={cn(
            "self-center",
            "text-neutral-500 dark:text-neutral-400",
            "hover:text-orange-500",
          )}
        >
          Other downloads
        </a>
      ) : null}

      {CURRENT_PLATFORM === APP_PLATFORM.MAC ? <MacOpenFix /> : null}
    </div>
  );
});

import { MdOutlineBrowserUpdated } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A card offering the latest release when the app is out of date */
export default memo(function AppUpdateCard({ currentVersion, latestVersion }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-xl",
        "bg-orange-50 dark:bg-orange-950/40",
        "border border-orange-200 dark:border-orange-900",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MdOutlineBrowserUpdated className="size-5 shrink-0 text-orange-500" />
        <div className="flex flex-col min-w-0">
          <h4 className="font-bold">A new version is available</h4>
          <p className="text-neutral-500 dark:text-neutral-400">
            {currentVersion} → {latestVersion}
          </p>
        </div>
      </div>

      <PrimaryButton
        as="a"
        target="_blank"
        href={import.meta.env.VITE_APP_RELEASE_PAGE_URL}
      >
        Get {latestVersion}
      </PrimaryButton>
    </div>
  );
});

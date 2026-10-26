import { BADGE_TONE } from "../lib/constants";
import { Dialog } from "radix-ui";

import AppActions from "./AppActions";
import AppLinkGrid from "./AppLinkGrid";
import AppUpdateCard from "./AppUpdateCard";
import BaseDialogContent from "./BaseDialogContent";
import Icon from "../assets/images/icon.png";
import SectionBadge from "./SectionBadge";
import { cn } from "../lib/utils";
import useAppVersion from "../hooks/useAppVersion";

/** A dialog with the app's version, update, links and support */
export default function AppInfoDialog() {
  const { currentVersion, latestRelease, hasUpdate } = useAppVersion();

  /** Whether the installed version is the latest release */
  const isLatest = Boolean(currentVersion && latestRelease && !hasUpdate);

  return (
    <BaseDialogContent className="gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 min-w-0">
        <img src={Icon} alt="" className="size-14 shrink-0" />

        <Dialog.Title
          className={cn(
            "text-2xl font-bold font-turret-road",
            "text-orange-500 text-center",
          )}
        >
          Purrfect Whiskers
        </Dialog.Title>

        <Dialog.Description
          className={cn(
            "text-center text-balance",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          The desktop app for running many accounts side by side
        </Dialog.Description>

        {/* Version */}
        {currentVersion ? (
          <div className="flex items-center gap-2">
            <SectionBadge tone={BADGE_TONE.NEUTRAL}>
              {currentVersion}
            </SectionBadge>
            {isLatest ? (
              <SectionBadge tone={BADGE_TONE.GREEN}>Up to date</SectionBadge>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasUpdate ? (
        <AppUpdateCard
          currentVersion={currentVersion}
          release={latestRelease}
        />
      ) : null}

      <AppLinkGrid />
      <AppActions currentVersion={currentVersion} />

      {/* Credits */}
      <div
        className={cn(
          "flex flex-col items-center gap-1",
          "text-center text-neutral-500 dark:text-neutral-400",
        )}
      >
        <p>
          Made with care by{" "}
          <a
            target="_blank"
            href={import.meta.env.VITE_APP_DEV_PORTFOLIO}
            className="font-bold text-orange-500"
          >
            {import.meta.env.VITE_APP_DEV_NAME}
          </a>
        </p>
        <a
          target="_blank"
          href={import.meta.env.VITE_APP_WEBSITE_URL}
          className="hover:text-orange-500"
        >
          &copy; Purrfect Farmer
        </a>
      </div>
    </BaseDialogContent>
  );
}

import { Dialog } from "radix-ui";

import AppConnect from "./AppConnect";
import AppDonate from "./AppDonate";
import AppLinks from "./AppLinks";
import AppUpdateCard from "./AppUpdateCard";
import BaseDialogContent from "./BaseDialogContent";
import Icon from "../assets/images/icon.png";
import SectionBadge from "./SectionBadge";
import { cn } from "../lib/utils";
import useAppVersion from "../hooks/useAppVersion";

/** A dialog with the app's version, update status and links */
export default function AppInfoDialog() {
  const { currentVersion, latestVersion, hasUpdate } = useAppVersion();

  return (
    <BaseDialogContent className="gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 min-w-0">
        <img src={Icon} alt="" className="size-20 shrink-0" />

        <Dialog.Title
          className={cn(
            "text-2xl font-bold font-turret-road",
            "text-orange-500 text-center",
          )}
        >
          Purrfect Whiskers
        </Dialog.Title>

        {/* Version */}
        <div className="flex items-center gap-2">
          {currentVersion ? (
            <SectionBadge tone="neutral">{currentVersion}</SectionBadge>
          ) : null}
          {hasUpdate ? (
            <SectionBadge tone="blue">Update available</SectionBadge>
          ) : latestVersion ? (
            <SectionBadge tone="green">Latest</SectionBadge>
          ) : null}
        </div>

        <Dialog.Description
          className={cn(
            "text-center text-balance",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          Efficiently manage multiple instances of the Purrfect Farmer
        </Dialog.Description>
      </div>

      {hasUpdate ? (
        <AppUpdateCard
          currentVersion={currentVersion}
          latestVersion={latestVersion}
        />
      ) : null}

      <AppLinks />
      <AppConnect />
      <AppDonate />

      {/* Copyright */}
      <a
        target="_blank"
        href={import.meta.env.VITE_APP_WEBSITE_URL}
        className={cn(
          "self-center",
          "text-neutral-500 dark:text-neutral-400",
          "hover:text-orange-500",
        )}
      >
        &copy; Purrfect Farmer
      </a>
    </BaseDialogContent>
  );
}

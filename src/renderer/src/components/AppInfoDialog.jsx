import semver from "semver";
import { Dialog } from "radix-ui";
import { MdOutlineBrowserUpdated } from "react-icons/md";

import Alert from "./Alert";
import BaseDialogContent from "./BaseDialogContent";
import Icon from "../assets/images/icon.png";
import PrimaryButton from "./PrimaryButton";

export default function AppInfoDialog({ currentVersion, latestVersion }) {
  return (
    <BaseDialogContent>
      {/* App Icon */}
      <img src={Icon} className="size-20 mx-auto" />

      <div className="flex flex-col gap-px">
        {/* Title and Description */}
        <Dialog.Title className="text-xl font-bold font-turret-road text-orange-500 text-center">
          Purrfect Whiskers
        </Dialog.Title>

        {/* Version */}
        <div className="text-base font-turret-road text-orange-500 text-center font-bold">
          Version: {currentVersion}
        </div>

        {/* Description */}
        <Dialog.Description className="text-center text-neutral-500 dark:text-neutral-400">
          Multi-Account sessions for the Purrfect Farmer
        </Dialog.Description>
      </div>

      {/* Latest Version */}
      {latestVersion && semver.gt(latestVersion, currentVersion) ? (
        <>
          <Alert variant={"danger"}>
            You are using an old version of the application. Update to the
            latest version.
          </Alert>
          <PrimaryButton
            as="a"
            target="_blank"
            href={import.meta.env.VITE_APP_RELEASE_PAGE_URL}
            className="flex justify-center items-center gap-2"
          >
            <MdOutlineBrowserUpdated className="size-5" /> Get Latest Version -{" "}
            {latestVersion}
          </PrimaryButton>
        </>
      ) : null}
    </BaseDialogContent>
  );
}

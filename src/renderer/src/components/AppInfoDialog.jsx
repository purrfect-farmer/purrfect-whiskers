import { Dialog } from "radix-ui";

import BaseDialogContent from "./BaseDialogContent";
import Icon from "../assets/images/icon.png";

export default function AppInfoDialog() {
  return (
    <BaseDialogContent>
      {/* App Icon */}
      <img src={Icon} className="size-20 mx-auto" />

      <div className="flex flex-col gap-px">
        {/* Title and Description */}
        <Dialog.Title className="text-xl font-bold font-turret-road text-orange-500 text-center">
          Purrfect Whiskers
        </Dialog.Title>
        <Dialog.Description className="text-center text-neutral-500 dark:text-neutral-400">
          Multi-Account sessions for the Purrfect Farmer
        </Dialog.Description>
      </div>

      {/* Version */}
      <div className="text-lg font-turret-road text-orange-500 text-center font-bold">
        v{window.electron.process.env["npm_package_version"]}
      </div>
    </BaseDialogContent>
  );
}

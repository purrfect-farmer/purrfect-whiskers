import { Dialog } from "radix-ui";
import {
  HiOutlineArrowPath,
  HiOutlineBars3,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";

import AccountListDialog from "./AccountListDialog";
import Icon from "../assets/images/icon.png";
import SettingsDialog from "./SettingsDialog";

export default function SideMenu() {
  return (
    <div className="shrink-0 w-14 p-2 h-full flex flex-col gap-2 items-center">
      {/* Account List */}
      <Dialog.Root>
        <Dialog.Trigger title="Accounts" className="p-2">
          <HiOutlineBars3 className="size-5 text-orange-500" />
        </Dialog.Trigger>

        <AccountListDialog />
      </Dialog.Root>

      {/* Settings */}
      <Dialog.Root>
        <Dialog.Trigger title="Settings" className="p-2">
          <HiOutlineCog6Tooth className="size-5 text-orange-500" />
        </Dialog.Trigger>

        <SettingsDialog />
      </Dialog.Root>

      {/* App Icon */}
      <img src={Icon} alt="Purrfect Whiskers" className="size-10 mt-auto" />

      {/* Reload */}
      <button
        title="Reload App"
        className="p-2"
        onClick={() => window.location.reload()}
      >
        <HiOutlineArrowPath className="size-5 text-orange-500" />
      </button>
    </div>
  );
}

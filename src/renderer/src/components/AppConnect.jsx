import { FaTelegram } from "react-icons/fa";
import { LuMegaphone, LuUserRound, LuUsers } from "react-icons/lu";

import AppLinkButton from "./AppLinkButton";
import SectionHeader from "./SectionHeader";

/** The app's Telegram links */
const connectLinks = [
  {
    title: "Channel",
    icon: LuMegaphone,
    href: import.meta.env.VITE_APP_TELEGRAM_CHANNEL,
  },
  {
    title: "Group",
    icon: LuUsers,
    href: import.meta.env.VITE_APP_TELEGRAM_GROUP,
  },
  {
    title: "Dev",
    icon: LuUserRound,
    href: import.meta.env.VITE_APP_DEV_CONTACT,
  },
];

/** A section with links to the app's Telegram channel, group and dev */
export default function AppConnect() {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <SectionHeader
        title="Telegram"
        badge={<FaTelegram className="size-4 text-sky-500" />}
      />

      <div className="grid grid-cols-3 gap-2">
        {connectLinks.map((link) => (
          <AppLinkButton key={link.title} href={link.href} icon={link.icon}>
            {link.title}
          </AppLinkButton>
        ))}
      </div>
    </div>
  );
}

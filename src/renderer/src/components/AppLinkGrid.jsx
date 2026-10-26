import { LuMegaphone, LuUserRound, LuUsers } from "react-icons/lu";

import { FaGithub } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { memo } from "react";

/** The app's website, repository and Telegram links */
const LINKS = [
  {
    title: "Website",
    icon: HiOutlineGlobeAlt,
    href: import.meta.env.VITE_APP_WEBSITE_URL,
  },
  {
    title: "GitHub",
    icon: FaGithub,
    href: import.meta.env.VITE_APP_REPOSITORY_URL,
  },
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
    title: "Developer",
    icon: LuUserRound,
    href: import.meta.env.VITE_APP_DEV_CONTACT,
  },
];

/** A row of the app's links, each an icon over its name */
export default memo(function AppLinkGrid() {
  return (
    <nav aria-label="Links" className="grid grid-cols-5 gap-2 min-w-0">
      {LINKS.map((link) => (
        <a
          key={link.title}
          target="_blank"
          href={link.href}
          className={cn(
            "flex flex-col items-center gap-1 min-w-0",
            "px-1 py-2.5 rounded-xl",
            "bg-neutral-100 dark:bg-neutral-700",
            "hover:bg-orange-500 hover:text-white",
          )}
        >
          <link.icon className="size-5 shrink-0" />
          <span className="max-w-full truncate text-xs font-bold">
            {link.title}
          </span>
        </a>
      ))}
    </nav>
  );
});

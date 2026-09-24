import { FaGithub } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";

import { cn } from "../lib/utils";

const links = [
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
];

export default function AppLinks() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <a
          key={link.title}
          target="_blank"
          href={link.href}
          className={cn(
            "flex items-center justify-center gap-2",
            "px-4 py-2 rounded-xl",
            "bg-neutral-100 dark:bg-neutral-700",
            "hover:bg-orange-500 hover:text-white",
          )}
        >
          <link.icon className="size-4" />
          {link.title}
        </a>
      ))}
    </div>
  );
}

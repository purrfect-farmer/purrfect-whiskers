import { FaGithub } from "react-icons/fa";
import { HiOutlineGlobeAlt } from "react-icons/hi2";

import AppLinkButton from "./AppLinkButton";
import SectionHeader from "./SectionHeader";

/** The app's website and repository links */
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

/** A section with links to the app's website and repository */
export default function AppLinks() {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <SectionHeader title="Links" />

      <div className="grid grid-cols-2 gap-2">
        {links.map((link) => (
          <AppLinkButton key={link.title} href={link.href} icon={link.icon}>
            {link.title}
          </AppLinkButton>
        ))}
      </div>
    </div>
  );
}

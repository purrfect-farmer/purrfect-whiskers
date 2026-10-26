import { cn } from "../lib/utils";

/** The app's Telegram links */
const connectLinks = [
  { title: "Channel", href: import.meta.env.VITE_APP_TELEGRAM_CHANNEL },
  { title: "Dev", href: import.meta.env.VITE_APP_DEV_CONTACT },
  { title: "Group", href: import.meta.env.VITE_APP_TELEGRAM_GROUP },
];

/** A row of links to the app's Telegram channel, dev and group */
export default function AppConnect() {
  return (
    <div className="flex justify-center text-xs">
      <div
        className={cn(
          "grid grid-cols-3 rounded-full overflow-hidden",
          "text-center font-turret-road font-bold",
          "bg-neutral-100 dark:bg-neutral-700",
          "divide-x divide-neutral-200 dark:divide-neutral-600",
        )}
      >
        {connectLinks.map((link) => (
          <a
            key={link.title}
            target="_blank"
            href={link.href}
            className="px-4 py-2 hover:bg-orange-500 hover:text-white"
          >
            {link.title}
          </a>
        ))}
      </div>
    </div>
  );
}

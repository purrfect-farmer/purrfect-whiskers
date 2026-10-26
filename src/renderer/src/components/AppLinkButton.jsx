import { cn } from "../lib/utils";
import { memo } from "react";

/** A link that opens outside the app, styled as a button with an icon */
export default memo(function AppLinkButton({ href, icon: Icon, children }) {
  return (
    <a
      target="_blank"
      href={href}
      className={cn(
        "flex items-center justify-center gap-2 min-w-0",
        "px-3 py-2.5 rounded-xl font-bold",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-orange-500 hover:text-white",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </a>
  );
});

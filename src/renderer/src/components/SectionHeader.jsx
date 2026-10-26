import { cn } from "../lib/utils";
import { memo } from "react";

/** A section's header: its title, an optional badge and actions on the right */
export default memo(function SectionHeader({
  title,
  badge = null,
  className,
  children,
}) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0 min-h-9", className)}>
      <div className="flex items-center gap-2 grow min-w-0">
        <h3
          className={cn(
            "shrink-0 font-bold uppercase tracking-wide",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {title}
        </h3>
        {badge}
      </div>

      {children ? (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      ) : null}
    </div>
  );
});

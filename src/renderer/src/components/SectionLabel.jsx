import { cn } from "../lib/utils";
import { memo } from "react";

/** Orange heading of a group of options */
export default memo(function SectionLabel({ className, ...props }) {
  return <label {...props} className={cn("text-orange-500 mt-2", className)} />;
});

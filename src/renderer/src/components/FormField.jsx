import { cn } from "../lib/utils";
import { memo } from "react";

/** A label, its control and the control's error */
export default memo(function FormField({ label, error, className, children }) {
  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <label className="text-neutral-500">{label}</label>
      {children}
      {error ? <p className="text-red-500">{error}</p> : null}
    </div>
  );
});

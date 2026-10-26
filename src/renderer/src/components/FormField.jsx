import { cn } from "../lib/utils";
import { memo } from "react";

/** A form field with a label, its control, a description and its error */
export default memo(function FormField({
  label,
  description,
  error,
  className,
  children,
}) {
  return (
    <div className={cn("flex flex-col gap-2 min-w-0", className)}>
      <label className="text-neutral-500">{label}</label>
      {children}
      {description ? (
        <p className="text-neutral-500 dark:text-neutral-400">{description}</p>
      ) : null}
      {error ? <p className="text-red-500">{error}</p> : null}
    </div>
  );
});

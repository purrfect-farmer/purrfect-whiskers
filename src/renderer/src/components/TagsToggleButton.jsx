import { HiTag } from "react-icons/hi2";
import IconButton from "./IconButton";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A button that shows or hides the tag filters, with the number of tags */
export default memo(function TagsToggleButton({
  count,
  shown,
  onToggle,
  disabled,
}) {
  return (
    <IconButton
      title={shown ? "Hide Tags" : "Show Tags"}
      aria-pressed={shown}
      active={shown}
      disabled={disabled}
      onClick={onToggle}
      className="gap-1 font-bold"
    >
      <HiTag
        className={cn("size-5", shown ? "text-orange-500" : "text-neutral-500")}
      />
      <span className="leading-none">{count}</span>
    </IconButton>
  );
});

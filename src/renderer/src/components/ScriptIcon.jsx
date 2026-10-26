import { LuSquareTerminal } from "react-icons/lu";
import { cn } from "../lib/utils";
import { memo } from "react";

/** A script's icon, or the default terminal icon, at the given size */
export default memo(function ScriptIcon({ icon, className }) {
  return icon ? (
    <img
      src={icon}
      alt=""
      className={cn("size-5 shrink-0 rounded object-cover", className)}
    />
  ) : (
    <LuSquareTerminal
      className={cn("size-5 shrink-0 text-orange-500", className)}
    />
  );
});

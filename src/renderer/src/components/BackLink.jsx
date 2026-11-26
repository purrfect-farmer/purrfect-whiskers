import { HiOutlineArrowLeft } from "react-icons/hi2";
import { cn } from "../lib/utils";

/** A link that steps back to an earlier screen */
export default function BackLink({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex justify-center items-center gap-2",
        "text-sm text-orange-500",
        "hover:underline",
        "disabled:opacity-50 disabled:no-underline",
      )}
    >
      <HiOutlineArrowLeft className="size-4" /> {children}
    </button>
  );
}

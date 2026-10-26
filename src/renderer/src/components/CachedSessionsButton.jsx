import IconButton from "./IconButton";
import { LuKeyRound } from "react-icons/lu";
import { clearCachedSessions } from "../lib/accountSessions";
import { memo } from "react";
import toast from "react-hot-toast";
import useCachedSessionCount from "../hooks/useCachedSessionCount";

/** The handler for forgetting every cached session */
const forgetSessions = () => {
  clearCachedSessions();
  toast.success("Cached sessions cleared. The next run reads them again.");
};

/** A button showing the number of cached sessions that forgets them */
export default memo(function CachedSessionsButton({ disabled }) {
  const count = useCachedSessionCount();

  return (
    <IconButton
      title={`Forget ${count} cached session(s)`}
      disabled={disabled || count === 0}
      onClick={forgetSessions}
      className="gap-1 font-bold"
    >
      <LuKeyRound className="size-5" />
      <span className="leading-none">{count}</span>
    </IconButton>
  );
});

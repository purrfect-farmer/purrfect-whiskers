import { memo, useCallback } from "react";

import { reloadRunningAccounts } from "../lib/accounts";
import toast from "react-hot-toast";

/** A toast for an installed update with a reload accounts button */
export default memo(function ExtensionUpdatedToast({ id, version }) {
  /** The handler for reloading the running accounts */
  const reload = useCallback(() => {
    toast.dismiss(id);
    reloadRunningAccounts();
  }, [id]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-0 break-words">
        Extension updated to {version}
      </span>
      <button
        type="button"
        onClick={reload}
        className="px-3 py-1 rounded-lg bg-orange-500 text-white font-bold"
      >
        Reload accounts
      </button>
    </div>
  );
});

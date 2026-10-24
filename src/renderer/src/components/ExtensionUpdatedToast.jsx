import { memo, useCallback } from "react";

import { reloadRunningAccounts } from "../lib/accounts";
import toast from "react-hot-toast";

/** Toast announcing an installed update, offering to reload the accounts */
export default memo(function ExtensionUpdatedToast({ id, version }) {
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

import { useCallback, useMemo, useState } from "react";

/** A hook for the open state of a dialog */
export default function useDialogState() {
  /** Whether the dialog is open */
  const [opened, setOpened] = useState(false);

  /** The opener of the dialog */
  const openDialog = useCallback(() => setOpened(true), []);
  /** The closer of the dialog */
  const closeDialog = useCallback(() => setOpened(false), []);

  return useMemo(
    () => ({
      opened,
      setOpened,
      openDialog,
      closeDialog,
    }),
    [opened, openDialog, closeDialog],
  );
}

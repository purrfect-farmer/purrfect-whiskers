import { useCallback, useMemo, useState } from "react";

export default function useDialogState() {
  const [opened, setOpened] = useState(false);

  const openDialog = useCallback(() => setOpened(true), []);
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

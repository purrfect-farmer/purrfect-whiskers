import { useEffect, useState } from "react";

/** Whether a persisted zustand store has loaded from storage */
export default function useStoreHydrated(store) {
  const [hasHydrated, setHasHydrated] = useState(() =>
    store.persist.hasHydrated(),
  );

  useEffect(() => {
    setHasHydrated(store.persist.hasHydrated());

    return store.persist.onFinishHydration(() => setHasHydrated(true));
  }, [store]);

  return hasHydrated;
}

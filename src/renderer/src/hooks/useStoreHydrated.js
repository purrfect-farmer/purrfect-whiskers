import { useEffect, useState } from "react";

/** A hook for whether a persisted zustand store has loaded */
export default function useStoreHydrated(store) {
  /** Whether the store has loaded */
  const [hasHydrated, setHasHydrated] = useState(() =>
    store.persist.hasHydrated(),
  );

  /** The tracking of the store's hydration */
  useEffect(() => {
    setHasHydrated(store.persist.hasHydrated());

    return store.persist.onFinishHydration(() => setHasHydrated(true));
  }, [store]);

  return hasHydrated;
}

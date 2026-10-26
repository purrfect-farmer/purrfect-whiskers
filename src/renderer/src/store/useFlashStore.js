import { FLASH_DURATION } from "../lib/constants";
import { create } from "zustand";

/** The timer that ends the flash */
let clearTimer = null;

/** The account currently flashing; `key` restarts the flash on every call */
export default create((set) => ({
  partition: null,
  key: 0,

  /** Flashes an account */
  flash: (partition) => {
    clearTimeout(clearTimer);
    clearTimer = setTimeout(
      () => set({ partition: null, key: 0 }),
      FLASH_DURATION,
    );

    set((state) => ({ partition, key: state.key + 1 }));
  },
}));

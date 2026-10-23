import { createContext, useContext, useMemo } from "react";

import { useSpiderAccountsForm } from "../hooks/useSpiderAccountsForm";
import { useSpiderCore } from "../hooks/useSpiderCore";

const SpiderContext = createContext();

/**
 * Holds Spider state above the dialog, so a purchase keeps running
 * after the dialog closes. `active` is the dialog's open state.
 */
export const SpiderProvider = ({ active, children }) => {
  const core = useSpiderCore({ active });
  const form = useSpiderAccountsForm({ core });

  const value = useMemo(() => ({ core, form }), [core, form]);

  return (
    <SpiderContext.Provider value={value}>{children}</SpiderContext.Provider>
  );
};

export const useSpider = () => useContext(SpiderContext);

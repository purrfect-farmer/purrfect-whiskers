import { Portal } from "solid-js/web";

import { cn } from "../src/lib/utils";

export default function App() {
  return (
    <Portal>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn(
          "fixed inset-y-0 left-0",
          "w-5/6 max-w-xs",
          "bg-white dark:bg-neutral-800",
          "flex flex-col"
        )}
      ></div>
    </Portal>
  );
}

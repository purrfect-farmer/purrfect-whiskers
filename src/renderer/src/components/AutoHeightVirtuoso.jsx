import ScrollAwareVirtuoso from "./ScrollAwareVirtuoso";
import { cn } from "../lib/utils";
import { useState } from "react";

/** The style that fills the list's sized box */
const FILL_STYLE = { height: "100%" };

/** A virtualized list that grows with its rows up to a max height, then scrolls */
export default function AutoHeightVirtuoso({ maxHeight, className, ...props }) {
  /** The height of the list's content */
  const [listHeight, setListHeight] = useState(0);

  return (
    <div
      className={cn("min-h-px", className)}
      style={{ height: Math.min(listHeight, maxHeight) }}
    >
      <ScrollAwareVirtuoso
        {...props}
        style={FILL_STYLE}
        totalListHeightChanged={setListHeight}
      />
    </div>
  );
}

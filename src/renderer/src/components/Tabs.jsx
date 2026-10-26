import { Tabs as TabsPrimitive } from "radix-ui";

import { cn } from "../lib/utils";

/** The grid column classes for each tab count */
const GRID_SIZES = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

/** The default renderer of the tab triggers */
const defaultRenderList = (content) => content;

/** A tab list built from a list of values */
const Tabs = ({
  children,
  rootClassName,
  listClassName,
  renderList = defaultRenderList,
  triggerClassName,
  disabled,
  tabs,
}) => {
  return (
    <TabsPrimitive.Root
      {...tabs.rootProps}
      className={cn("flex flex-col gap-2", rootClassName)}
    >
      <TabsPrimitive.List
        className={cn("grid", GRID_SIZES[tabs.list.length], listClassName)}
      >
        {renderList(
          tabs.list.map((value, index) => (
            <TabsPrimitive.Trigger
              key={index}
              value={value}
              disabled={disabled}
              className={cn(
                "p-2 rounded-t-lg disabled:opacity-50",
                "border-b-4 border-transparent",
                "data-[state=active]:border-orange-500",
                triggerClassName
              )}
            >
              {value.toUpperCase()}
            </TabsPrimitive.Trigger>
          ))
        )}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
};

/** A tab panel that stays mounted while hidden */
const TabsContent = (props) => (
  <TabsPrimitive.Content
    forceMount
    {...props}
    className={cn("data-[state=inactive]:hidden", props.className)}
  />
);

Tabs.Content = TabsContent;

export default Tabs;

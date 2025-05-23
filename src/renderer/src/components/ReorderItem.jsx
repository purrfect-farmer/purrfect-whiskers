import propTypes from "prop-types";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import { Reorder, useDragControls } from "motion/react";
import { memo } from "react";

import { cn } from "../lib/utils";

const ReorderItem = memo(function ReorderItem({
  children,
  hideHandle,
  ...props
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item {...props} dragListener={false} dragControls={dragControls}>
      <div className="flex gap-2">
        <div className="min-w-0 min-h-0 grow flex flex-col">{children}</div>
        <button
          className={cn(
            "bg-neutral-100 dark:bg-neutral-700",
            "hover:bg-orange-100 hover:text-orange-700",
            "dark:hover:bg-orange-200 dark:hover:text-orange-500",
            "flex items-center justify-center",
            "px-3 rounded-xl shrink-0",
            "touch-none",
            hideHandle && "hidden"
          )}
          onPointerDown={(event) => dragControls.start(event)}
        >
          <HiOutlineSquares2X2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
});

ReorderItem.propTypes = {
  children: propTypes.node,
  hideHandle: propTypes.bool,
};

export default ReorderItem;

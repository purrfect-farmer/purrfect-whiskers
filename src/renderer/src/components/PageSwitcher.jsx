import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "../lib/utils";
import { memo } from "react";
import useAppStore from "../store/useAppStore";

/** Page buttons, each with a button closing the accounts on that page */
export default memo(function PageSwitcher({ pageCount, currentPage }) {
  const setPage = useAppStore((state) => state.setPage);
  const closePage = useAppStore((state) => state.closePage);

  return (
    <div
      className={cn(
        "shrink-0 p-2 flex flex-col gap-2",
        "overflow-auto empty:hidden",
      )}
    >
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <div key={pageIndex} className="flex gap-1">
          <button
            type="button"
            title={`Page ${pageIndex + 1}`}
            className={cn(
              "p-2 w-14 rounded-xl border border-transparent",
              currentPage === pageIndex
                ? [
                    "border-orange-500 bg-orange-100 text-orange-500",
                    "dark:bg-neutral-700 dark:text-orange-500",
                    "font-bold",
                  ]
                : "bg-neutral-100 dark:bg-neutral-700",
            )}
            onClick={() => setPage(pageIndex)}
          >
            {pageIndex + 1}
          </button>

          {/* Close Page */}
          <button
            type="button"
            title={`Close Page ${pageIndex + 1}`}
            className={cn(
              "p-2 rounded-xl border border-transparent",
              "bg-neutral-100 dark:bg-neutral-700",
              "hover:bg-orange-100 hover:text-orange-500",
              "dark:hover:bg-neutral-600",
            )}
            onClick={() => closePage(pageIndex)}
          >
            <HiOutlineXMark className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
});

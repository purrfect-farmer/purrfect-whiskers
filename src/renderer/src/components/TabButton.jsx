import { useRef, useCallback, useEffect } from "react";
import { HiOutlineXMark } from "react-icons/hi2";
import BrowserIcon from "../assets/images/browser.png";
import { cn } from "../lib/utils";

/** A tab button with a close button */
export const TabButton = ({
  tab,
  setActiveTab,
  closeTab,
  scrollToTabButton,
}) => {
  /**
   * The tab button's element
   * @type {import("react").Ref<HTMLDivElement>}
   */
  const buttonRef = useRef();

  /** The handler for switching to the tab */
  const handleTabButtonClick = useCallback(() => {
    setActiveTab(tab.id);
  }, [tab.id, setActiveTab]);

  /** The handler for closing the tab */
  const handleCloseButtonClick = useCallback(
    (ev) => {
      /** Stop Propagation */
      ev.stopPropagation();

      /** Close Tab */
      closeTab(tab.id);
    },
    [tab.id, closeTab],
  );

  /** Scroll into View */
  useEffect(() => {
    if (tab.active) {
      scrollToTabButton(buttonRef.current);
    }
  }, [tab.active, scrollToTabButton]);

  return (
    <div
      key={tab.id}
      ref={buttonRef}
      onClick={handleTabButtonClick}
      className={cn(
        tab.active && "bg-neutral-100 dark:bg-neutral-700",
        "p-1.5 rounded-full shrink-0",
        "flex gap-2 items-center",
        "cursor-pointer",
      )}
    >
      {/* Icon */}
      <img
        key={tab.icon || "default-icon"}
        src={tab.icon || BrowserIcon}
        className="size-6 rounded-full"
      />

      {/* Title */}
      <h1 className={cn("font-bold", "max-w-10 truncate")}>{tab.title}</h1>

      {/* Close Button */}
      <button
        type="button"
        onClick={handleCloseButtonClick}
        className={cn(
          "p-1 rounded-full",
          "flex items-center justify-center",
          tab.active && "bg-neutral-200 dark:bg-neutral-600",
        )}
      >
        <HiOutlineXMark className="size-4" />
      </button>
    </div>
  );
};

import { HiOutlinePlus, HiOutlineXMark } from "react-icons/hi2";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import BrowserIcon from "../assets/images/browser.png";
import BrowserTab from "./BrowserTab";
import WebviewButton from "./WebviewButton";
import { cn, uuid } from "../lib/utils";

/** Get new tab */
const getNewTab = () => ({
  id: uuid(),
  active: true,
  title: "New Tab",
});

const TabButton = ({ tab, setActiveTab, closeTab, scrollToTabButton }) => {
  /**
   * @type {import("react").Ref<HTMLDivElement>}
   */
  const buttonRef = useRef();

  /** Button Click Handler */
  const handleTabButtonClick = useCallback(() => {
    setActiveTab(tab.id);
  }, [tab.id, setActiveTab]);

  /** Close Button Click Handler */
  const handleCloseButtonClick = useCallback(
    (ev) => {
      /** Stop Propagation */
      ev.stopPropagation();

      /** Close Tab */
      closeTab(tab.id);
    },
    [tab.id, closeTab]
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
        "cursor-pointer"
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
        onClick={handleCloseButtonClick}
        className={cn(
          "p-1 rounded-full",
          "flex items-center justify-center",
          tab.active && "bg-neutral-200 dark:bg-neutral-600"
        )}
      >
        <HiOutlineXMark className="size-4" />
      </button>
    </div>
  );
};

export default memo(function Browser({ account, isDesktop }) {
  const tabButtonsContainerRef = useRef();
  const [tabs, setTabs] = useState(() => [getNewTab()]);

  /** Set Active Tab */
  const setActiveTab = useCallback(
    (id) => {
      setTabs((prev) =>
        prev.map((item) => ({ ...item, active: item.id === id }))
      );
    },
    [setTabs]
  );

  /** Add Tab */
  const addTab = useCallback(() => {
    setTabs((prev) => [
      ...prev.map((item) => ({ ...item, active: false })),
      getNewTab(),
    ]);
  }, [setTabs]);

  /** Close Tab */
  const closeTab = useCallback(
    (id) => {
      setTabs((prev) => {
        /** Get Index */
        const itemIndex = prev.findIndex((item) => item.id === id);

        if (itemIndex > -1) {
          const wasActive = prev[itemIndex].active;
          const result = prev
            .filter((tab) => tab.id !== id)
            .map((tab, index) => ({
              ...tab,
              active: wasActive
                ? index === Math.max(itemIndex - 1, 0)
                : tab.active,
            }));
          return result;
        } else {
          return prev;
        }
      });
    },
    [setTabs]
  );

  /** Update Title */
  const updateTitle = useCallback(
    (id, title) => {
      setTabs((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title } : item))
      );
    },
    [setTabs]
  );

  /** Update Icon */
  const updateIcon = useCallback(
    (id, icons) => {
      setTabs((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, icon: icons[0] } : item
        )
      );
    },
    [setTabs]
  );

  /** Scroll to Tab Button */
  const scrollToTabButton = useCallback((element) => {
    const container = tabButtonsContainerRef.current;

    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const offsetLeft =
      elementRect.left - containerRect.left + container.scrollLeft;
    const targetScrollLeft =
      offsetLeft - container.clientWidth / 2 + element.offsetWidth / 2;

    container.scrollTo({ left: targetScrollLeft, behavior: "smooth" });
  }, []);

  return (
    <div className="grow flex flex-col">
      <div
        ref={tabButtonsContainerRef}
        className={cn(
          "w-full relative z-0",
          "flex items-center shrink-0 py-1 pr-2",
          "overflow-auto scrollbar-thin"
        )}
      >
        {/* Main */}
        <div className="sticky left-0 py-1 px-2 bg-white z-1 dark:bg-neutral-800 shrink-0">
          <WebviewButton onClick={addTab}>
            <HiOutlinePlus className="size-4" />
          </WebviewButton>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1 flex-nowrap shrink-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              setActiveTab={setActiveTab}
              closeTab={closeTab}
              scrollToTabButton={scrollToTabButton}
            />
          ))}
        </div>
      </div>

      <div className="relative grow">
        {tabs.map((item) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 flex flex-col",
              !item.active && "invisible"
            )}
          >
            <BrowserTab
              id={item.id}
              partition={account.partition}
              isDesktop={isDesktop}
              updateTitle={updateTitle}
              updateIcon={updateIcon}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import { memo, useCallback, useEffect, useRef } from "react";

import Input from "./Input";
import WebviewButton from "./WebviewButton";
import { cn } from "../lib/utils";
import isUrl from "is-url";
import normalizeUrl from "normalize-url";
import useWebviewControls from "../hooks/useWebviewControls";

export default memo(function BrowserTab({
  id,
  url,
  closeTab,
  partition,
  updateTitle,
  updateIcon,
}) {
  const { ref, isLoading, goBack, goForward, reload, stop, callWebviewMethod } =
    useWebviewControls();

  /** Address Bar */
  const addressBarRef = useRef();

  /**
   * Handle Form Submit
   */
  const handleFormSubmit = useCallback(
    (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      /** Blur */
      addressBarRef.current.blur();

      /** Get Input */
      const input = addressBarRef.current.value;
      const url = normalizeUrl(input);

      callWebviewMethod((webview) => {
        webview.loadURL(
          isUrl(url)
            ? url
            : `https://www.google.com/search?q=${encodeURIComponent(input)}`,
        );
      });
    },
    [callWebviewMethod],
  );

  /** Address Bar Update */
  useEffect(() => {
    const webview = ref.current;

    const handleNavigate = (ev) => {
      addressBarRef.current.value = ev.url;
    };

    webview.addEventListener("did-navigate", handleNavigate);
    webview.addEventListener("did-navigate-in-page", handleNavigate);

    return () => {
      webview.removeEventListener("did-navigate", handleNavigate);
      webview.removeEventListener("did-navigate-in-page", handleNavigate);
    };
  }, [ref]);

  /** Handle Window Close */
  useEffect(() => {
    const webview = ref.current;

    /** Listen for Window Close */
    const listener = () => {
      closeTab(id);
    };

    /** Listen For Close */
    webview.addEventListener("close", listener);

    return () => webview.removeEventListener("close", listener);
  }, [ref, id, closeTab]);

  /** Favicon and Title */
  useEffect(() => {
    const webview = ref.current;

    /** Handle Page Title */
    const handlePageTitle = (ev) => {
      updateTitle(id, ev.title);
    };

    /** Handle Favicons */
    const handleFavicons = (ev) => {
      updateIcon(id, ev.favicons);
    };

    /** Update Title */
    webview.addEventListener("page-title-updated", handlePageTitle);

    /** Update Icon */
    webview.addEventListener("page-favicon-updated", handleFavicons);

    return () => {
      /** Remove Handler for Update Title */
      webview.removeEventListener("page-title-updated", handlePageTitle);

      /** Remove Handler for Update Icon */
      webview.removeEventListener("page-favicon-updated", handleFavicons);
    };
  }, [ref, id, updateTitle, updateIcon]);

  return (
    <div
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700",
      )}
    >
      <div className="p-2 flex gap-1 items-center">
        <div className="flex gap-1">
          {/* Back */}
          <WebviewButton onClick={goBack} title="Go Back">
            <HiOutlineArrowLeft className="size-4" />
          </WebviewButton>

          {/* Forward */}
          <WebviewButton onClick={goForward} title="Go Forward">
            <HiOutlineArrowRight className="size-4" />
          </WebviewButton>
        </div>

        <form onSubmit={handleFormSubmit} className="w-full">
          <Input
            className="rounded-full p-2"
            placeholder="Enter URL"
            ref={addressBarRef}
          />
        </form>

        {/* Stop */}
        {isLoading ? (
          <WebviewButton onClick={stop} title="Stop">
            <HiOutlineXMark className="size-4" />
          </WebviewButton>
        ) : (
          <WebviewButton onClick={reload} title="Refresh">
            <HiOutlineArrowPath className="size-4" />
          </WebviewButton>
        )}
      </div>
      <webview
        src={url}
        allowpopups="true"
        className="grow bg-white"
        partition={partition}
        ref={ref}
      />
    </div>
  );
});

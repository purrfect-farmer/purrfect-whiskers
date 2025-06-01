import normalizeUrl from "normalize-url";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import { memo, useCallback, useEffect, useRef } from "react";

import Input from "./Input";
import WebviewButton from "./WebviewButton";
import useWebviewControls from "../hooks/useWebviewControls";
import { cn } from "../lib/utils";
import { userAgent, userAgentDesktop } from "../lib/userAgent";

const INITIAL_URL = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;

export default memo(function Browser({ account, isDesktop }) {
  const { partition } = account;
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

      callWebviewMethod((webview) =>
        webview.loadURL(normalizeUrl(addressBarRef.current.value))
      );
    },
    [callWebviewMethod]
  );

  /** Address Bar Update */
  useEffect(() => {
    const webview = ref.current;
    /** Did Navigate */
    webview.addEventListener("did-navigate", (ev) => {
      addressBarRef.current.value = ev.url;
    });

    /** Navigate in Page */
    webview.addEventListener("did-navigate-in-page", (ev) => {
      addressBarRef.current.value = ev.url;
    });
  }, []);

  /** User-Agent */
  useEffect(() => {
    callWebviewMethod((webview) =>
      webview.setUserAgent(isDesktop ? userAgentDesktop : userAgent)
    );
  }, [callWebviewMethod, isDesktop]);

  return (
    <div
      className={cn(
        "grow flex flex-col shrink-0",
        "divide-y dark:divide-neutral-700"
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
        src={INITIAL_URL}
        allowpopups="true"
        className="grow bg-white"
        partition={partition}
        ref={ref}
      />
    </div>
  );
});

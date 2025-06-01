import normalizeUrl from "normalize-url";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useCallback, useEffect, useRef, useState } from "react";

import Input from "./Input";
import WebviewButton from "./WebviewButton";
import { cn } from "../lib/utils";

const INITIAL_URL = "https://purrfectfarmer.com";

export default function Browser({ account }) {
  const { partition } = account;
  /**
   * @type {import("react").Ref<import("electron").WebviewTag>}
   */
  const webviewRef = useRef();
  const addressBarRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState(INITIAL_URL);

  /**
   * Handle Form Submit
   */
  const handleFormSubmit = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    addressBarRef.current.blur();

    setUrl(normalizeUrl(addressBarRef.current.value));
  };

  /** Call Webview Method */
  const callWebviewMethod = useCallback(
    (callback) => {
      const webview = webviewRef.current;
      if (webview && isReady) {
        callback(webview);
      }
    },
    [isReady]
  );

  /** Go Back */
  const goBack = useCallback(
    () => callWebviewMethod((webview) => webview.goBack()),
    [callWebviewMethod]
  );

  /** Go Forward */
  const goForward = useCallback(
    () => callWebviewMethod((webview) => webview.goForward()),
    [callWebviewMethod]
  );

  /** Stop Webview */
  const stop = useCallback(
    () => callWebviewMethod((webview) => webview.stop()),
    [callWebviewMethod]
  );

  /** Reload Webview */
  const reload = useCallback(
    () => callWebviewMethod((webview) => webview.reload()),
    [callWebviewMethod]
  );

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      /** DOM Ready */
      webview.addEventListener("dom-ready", () => {
        setIsReady(true);
      });

      /** Start Loading */
      webview.addEventListener("did-start-loading", (ev) => {
        setIsLoading(true);
      });

      /** Stop Loading */
      webview.addEventListener("did-stop-loading", (ev) => {
        setIsLoading(false);
      });

      /** Did Navigate */
      webview.addEventListener("did-navigate", (ev) => {
        addressBarRef.current.value = ev.url;
      });

      /** Navigate in Page */
      webview.addEventListener("did-navigate-in-page", (ev) => {
        addressBarRef.current.value = ev.url;
      });

      /** Context Menu */
      webview.addEventListener("context-menu", () => {
        webview.openDevTools({ mode: "detach" });
      });
    }
  }, [setIsReady, setIsLoading]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview && isReady) {
      webview.loadURL(url);
    }
  }, [isReady, url]);

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

        <form onSubmit={handleFormSubmit}>
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
        useragent="Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36 Telegram-Android/11.6.1 (Samsung SM-G998B; Android 14; SDK 34; HIGH)"
        partition={partition}
        ref={webviewRef}
      />
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";

export default function useWebviewControls() {
  /**
   * @type {import("react").Ref<import("electron").WebviewTag>}
   */
  const ref = useRef();

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** Call Webview Method */
  const callWebviewMethod = useCallback(
    (callback) => {
      const webview = ref.current;
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

  /** Setup Webview */
  useEffect(() => {
    const webview = ref.current;
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

      /** Context Menu */
      webview.addEventListener("context-menu", () => {
        webview.openDevTools({ mode: "detach" });
      });
    }
  }, [setIsReady, setIsLoading]);

  return {
    ref,
    isReady,
    isLoading,
    callWebviewMethod,
    goBack,
    goForward,
    stop,
    reload,
  };
}

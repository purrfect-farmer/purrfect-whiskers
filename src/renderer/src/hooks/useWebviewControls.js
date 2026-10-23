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
    /**
     * Executes the given callback with the current webview instance if it exists and is ready.
     *
     * @param {(webview: import("electron").WebviewTag) => any} callback
     */
    (callback) => {
      const webview = ref.current;
      if (webview && isReady) {
        callback(webview);
      }
    },
    [isReady],
  );

  /** Go Back */
  const goBack = useCallback(
    () => callWebviewMethod((webview) => webview.goBack()),
    [callWebviewMethod],
  );

  /** Go Forward */
  const goForward = useCallback(
    () => callWebviewMethod((webview) => webview.goForward()),
    [callWebviewMethod],
  );

  /** Stop Webview */
  const stop = useCallback(
    () => callWebviewMethod((webview) => webview.stop()),
    [callWebviewMethod],
  );

  /** Reload Webview */
  const reload = useCallback(
    () => callWebviewMethod((webview) => webview.reload()),
    [callWebviewMethod],
  );

  /** Track Ready and Loading State */
  useEffect(() => {
    const webview = ref.current;

    if (!webview) return;

    const handleDomReady = () => setIsReady(true);
    const handleStartLoading = () => setIsLoading(true);
    const handleStopLoading = () => setIsLoading(false);

    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-start-loading", handleStartLoading);
    webview.addEventListener("did-stop-loading", handleStopLoading);

    return () => {
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-start-loading", handleStartLoading);
      webview.removeEventListener("did-stop-loading", handleStopLoading);
    };
  }, []);

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

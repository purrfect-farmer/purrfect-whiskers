import { useCallback, useEffect, useRef, useState } from "react";

/** A hook for controlling a webview */
export default function useWebviewControls() {
  /**
   * The webview element
   *
   * @type {import("react").Ref<import("electron").WebviewTag>}
   */
  const ref = useRef();

  /** Whether the webview is ready */
  const [isReady, setIsReady] = useState(false);
  /** Whether the webview is loading */
  const [isLoading, setIsLoading] = useState(false);

  /** The call of a method on the ready webview */
  const callWebviewMethod = useCallback(
    /**
     * Runs the callback with the webview if it is ready.
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

  /** The navigation back */
  const goBack = useCallback(
    () => callWebviewMethod((webview) => webview.goBack()),
    [callWebviewMethod],
  );

  /** The navigation forward */
  const goForward = useCallback(
    () => callWebviewMethod((webview) => webview.goForward()),
    [callWebviewMethod],
  );

  /** The stop of the loading */
  const stop = useCallback(
    () => callWebviewMethod((webview) => webview.stop()),
    [callWebviewMethod],
  );

  /** The reload of the page */
  const reload = useCallback(
    () => callWebviewMethod((webview) => webview.reload()),
    [callWebviewMethod],
  );

  /** The tracking of the ready and loading state */
  useEffect(() => {
    const webview = ref.current;

    if (!webview) return;

    /** The handler of the dom-ready event */
    const handleDomReady = () => setIsReady(true);
    /** The handler of a load start */
    const handleStartLoading = () => setIsLoading(true);
    /** The handler of a load stop */
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

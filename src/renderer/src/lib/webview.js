export function createWebview(partition, extensionPath) {
  /** Create the <webview> element */
  const webview = document.createElement("webview");

  webview.setAttribute("partition", partition);
  webview.setAttribute("plugins", "true");
  webview.setAttribute("nodeintegration", "true");
  webview.setAttribute("allowpopups", "true");
  webview.setAttribute(
    "webpreferences",
    "nodeIntegration, webSecurity=false, sandbox=false"
  );
  webview.setAttribute(
    "useragent",
    "Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36 Telegram-Android/11.6.1 (Samsung SM-G998B; Android 14; SDK 34; HIGH)"
  );
  webview.style.width = "100%";
  webview.style.height = "100%";

  /** Context Menu */
  webview.addEventListener("context-menu", () => {
    webview.openDevTools({ mode: "detach" });
  });

  /** Load extension URL */
  window.electron.ipcRenderer
    .invoke("setup-session", { partition, extensionPath })
    .then((extension) => {
      webview.src = extension
        ? extension.url + "index.html"
        : import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
    })
    .catch(() => {
      webview.src = import.meta.env.VITE_DEFAULT_WEBVIEW_URL;
    });

  return webview;
}

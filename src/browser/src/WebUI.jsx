import { createSignal, onMount } from "solid-js";

function WebUI() {
  const [windowId, setWindowId] = createSignal(-1);
  const [activeTabId, setActiveTabId] = createSignal(-1);
  const [tabList, setTabList] = createSignal([]);
  const [addressUrl, setAddressUrl] = createSignal("");

  onMount(async () => {
    const tabs = await new Promise((resolve) =>
      chrome.tabs.query({ windowId: -2 }, resolve)
    );
    setTabList(tabs);

    const active = tabs.find((t) => t.active);
    if (active) {
      setActiveTab(active);
    }

    setupBrowserListeners();

    const platformClass = `platform-${navigator.userAgentData.platform.toLowerCase()}`;
    document.body.classList.add(platformClass);
  });

  function setActiveTab(tab) {
    setActiveTabId(tab.id);
    setWindowId(tab.windowId);

    setTabList((tabs) =>
      tabs.map((t) => ({
        ...t,
        active: t.id === tab.id,
      }))
    );

    setAddressUrl(tab.url);
  }

  function setupBrowserListeners() {
    if (!chrome.tabs.onCreated) {
      throw new Error("chrome global not setup.");
    }

    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.windowId !== windowId()) return;
      setTabList((tabs) => [...tabs, tab]);
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (activeInfo.windowId !== windowId()) return;

      chrome.tabs.get(activeInfo.tabId, (tab) => {
        setActiveTab(tab);
      });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      setTabList((tabs) =>
        tabs.map((t) => (t.id === tabId ? { ...t, ...tab } : t))
      );
      if (tabId === activeTabId()) {
        setAddressUrl(tab.url);
      }
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      setTabList((tabs) => tabs.filter((t) => t.id !== tabId));
    });
  }

  // Event handlers
  const onCreateTab = () => chrome.tabs.create();
  const onGoBack = () => chrome.tabs.goBack();
  const onGoForward = () => chrome.tabs.goForward();
  const onReload = () => chrome.tabs.reload();

  function onAddressUrlKeyPress(e) {
    if (e.code === "Enter") {
      chrome.tabs.update(activeTabId(), { url: addressUrl() });
    }
  }

  const onMinimize = () =>
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      chrome.windows.update(win.id, {
        state: win.state === "minimized" ? "normal" : "minimized",
      });
    });

  const onMaximize = () =>
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, (win) => {
      chrome.windows.update(win.id, {
        state: win.state === "maximized" ? "normal" : "maximized",
      });
    });

  const onClose = () => chrome.windows.remove(chrome.windows.WINDOW_ID_CURRENT);

  return (
    <div class="topbar">
      <div id="tabstrip">
        <div class="tab-container">
          <ul class="tab-list">
            {tabList().map((tab) => (
              <li
                class={`tab${tab.active ? " active" : ""}`}
                data-tab-id={tab.id}
                onClick={() => chrome.tabs.update(tab.id, { active: true })}
              >
                <img
                  class="favicon"
                  src={tab.favIconUrl}
                  alt=""
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  onLoad={(e) => (e.currentTarget.style.display = "")}
                />
                <span class="title">{tab.title}</span>
                <div class="controls">
                  <button
                    class="control audio"
                    disabled={!tab.audible}
                    title="Audio"
                  >
                    🔊
                  </button>
                  <button
                    class="control close"
                    onClick={(e) => {
                      e.stopPropagation();
                      chrome.tabs.remove(tab.id);
                    }}
                    title="Close Tab"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button id="createtab" onClick={onCreateTab}>
            +
          </button>
          <div class="app-drag"></div>
          <div class="window-controls">
            <button id="minimize" class="control" onClick={onMinimize}>
              🗕
            </button>
            <button id="maximize" class="control" onClick={onMaximize}>
              🗖
            </button>
            <button id="close" class="control" onClick={onClose}>
              🗙
            </button>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="page-controls">
          <button id="goback" class="control" onClick={onGoBack}>
            ⬅️
          </button>
          <button id="goforward" class="control" onClick={onGoForward}>
            ➡️
          </button>
          <button id="reload" class="control" onClick={onReload}>
            🔄
          </button>
        </div>
        <div class="address-bar">
          <input
            id="addressurl"
            spellcheck="false"
            value={addressUrl()}
            onInput={(e) => setAddressUrl(e.currentTarget.value)}
            onKeyPress={onAddressUrlKeyPress}
          />
        </div>
        <browser-action-list
          id="actions"
          alignment="bottom left"
        ></browser-action-list>
      </div>
    </div>
  );
}

export default WebUI;

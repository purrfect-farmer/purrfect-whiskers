import __contextMenu from "electron-context-menu";

/** @type {import("electron-context-menu").default} */
const contextMenu = __contextMenu.default || __contextMenu;

/**
 * Register a context menu
 * @param {import('electron-context-menu').Options} options
 * @returns
 */
export function registerContextMenu(options) {
  return contextMenu({
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showCopyVideoAddress: true,
    showSaveVideo: true,
    showSaveVideoAs: true,
    showCopyLink: true,
    showSaveLinkAs: true,
    showInspectElement: true,
    ...options,
  });
}

import { IPC } from "../../../shared/constants/ipc";
import { THEME } from "../lib/constants";
import { useEffect } from "react";
import { useMedia } from "react-use";

export default function useTheme(theme) {
  const systemIsDark = useMedia("(prefers-color-scheme: dark)");

  /** Configure Theme in Main Process */
  useEffect(() => {
    window.electron.ipcRenderer.invoke(IPC.CONFIGURE_THEME, theme);
  }, [theme]);

  /** Apply Theme */
  useEffect(() => {
    const isDark =
      theme === THEME.DARK || (theme === THEME.SYSTEM && systemIsDark);

    document.documentElement.classList.toggle("dark", isDark);
    document
      .querySelector("meta[name=theme-color]")
      .setAttribute("content", isDark ? "#262626" : "#ffffff");
  }, [theme, systemIsDark]);
}

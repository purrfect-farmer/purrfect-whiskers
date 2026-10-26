import { IPC } from "../../../shared/constants/ipc";
import { THEME } from "../lib/constants";
import { useEffect } from "react";
import { useMedia } from "react-use";

/** A hook for applying the chosen theme */
export default function useTheme(theme) {
  /** Whether the system prefers dark */
  const systemIsDark = useMedia("(prefers-color-scheme: dark)");

  /** The theme setup in the main process */
  useEffect(() => {
    window.electron.ipcRenderer.invoke(IPC.CONFIGURE_THEME, theme);
  }, [theme]);

  /** The application of the theme to the page */
  useEffect(() => {
    /** Whether the dark theme is on */
    const isDark =
      theme === THEME.DARK || (theme === THEME.SYSTEM && systemIsDark);

    document.documentElement.classList.toggle("dark", isDark);
    document
      .querySelector("meta[name=theme-color]")
      .setAttribute("content", isDark ? "#262626" : "#ffffff");
  }, [theme, systemIsDark]);
}

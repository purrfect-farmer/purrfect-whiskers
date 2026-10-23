import { AppProvider } from "./providers/AppProvider";
import Icon from "./assets/images/icon.png";
import PageSwitcher from "./components/PageSwitcher";
import SideMenu from "./components/SideMenu";
import { Toaster } from "react-hot-toast";
import Webview from "./components/Webview";
import { cn } from "./lib/utils";
import useAccountsRestoration from "./hooks/useAccountsRestoration";
import useAppStore from "./store/useAppStore";
import useExtensionUpdate from "./hooks/useExtensionUpdate";
import useSettingsStore from "./store/useSettingsStore";
import { useShallow } from "zustand/react/shallow";
import useTheme from "./hooks/useTheme";
import useWakeLock from "./hooks/useWakeLock";

const TOAST_OPTIONS = {
  duration: 2000,
  loading: {
    duration: Infinity,
  },
};

/** Partitions of the running accounts, in account order */
const selectRunningPartitions = (state) =>
  state.accounts.filter((item) => item.running).map((item) => item.partition);

function App() {
  const page = useAppStore((state) => state.page);
  const runningPartitions = useAppStore(useShallow(selectRunningPartitions));

  const theme = useSettingsStore((state) => state.theme);
  const columns = useSettingsStore((state) => state.columns);
  const rows = useSettingsStore((state) => state.rows);

  const itemsPerPage = columns * rows;
  const pageCount = Math.ceil(runningPartitions.length / itemsPerPage);
  const currentPage = Math.max(0, Math.min(page, pageCount - 1));

  /** Close Previous Accounts */
  useAccountsRestoration();

  /** WakeLock */
  useWakeLock();

  /** Set Preferred Theme */
  useTheme(theme);

  /** Update Extension */
  useExtensionUpdate();

  return (
    <AppProvider currentPage={currentPage}>
      {/* Application */}
      <div className="flex h-screen w-screen divide-x dark:divide-neutral-700">
        <SideMenu />
        <div className="grow min-w-0 overflow-clip">
          <div
            className={cn(
              "h-full grid grid-cols-(--grid-cols) auto-rows-(--auto-rows)",
              "-translate-y-(--current-page)",
              "transition-transform duration-500",
              "divide-x dark:divide-neutral-700",
            )}
            style={{
              "--current-page": `${currentPage * 100}%`,
              "--grid-cols": `repeat(${columns}, minmax(0, 1fr))`,
              "--auto-rows": `${100 / rows}%`,
            }}
          >
            {runningPartitions.length > 0 ? (
              runningPartitions.map((partition, index) => (
                <Webview
                  key={partition}
                  partition={partition}
                  pageIndex={Math.floor(index / itemsPerPage)}
                />
              ))
            ) : (
              <div
                className={cn(
                  "flex flex-col justify-center items-center gap-4",
                  "col-span-(--col-span) row-span-(--row-span)",
                )}
                style={{
                  "--col-span": columns,
                  "--row-span": rows,
                }}
              >
                <img src={Icon} className="size-48 max-w-full" />
                <h1 className="text-4xl font-turret-road text-orange-500 text-center">
                  Purrfect Whiskers
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Pages */}
        <PageSwitcher pageCount={pageCount} currentPage={currentPage} />
      </div>

      {/* Toaster */}
      <Toaster position="top-center" toastOptions={TOAST_OPTIONS} />
    </AppProvider>
  );
}

export default App;

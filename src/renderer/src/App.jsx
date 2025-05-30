import { HiOutlineXMark } from "react-icons/hi2";
import { Toaster } from "react-hot-toast";
import { useCallback, useMemo } from "react";

import Icon from "./assets/images/icon.png";
import SideMenu from "./components/SideMenu";
import Webview from "./components/Webview";
import useAccountsRestoration from "./hooks/useAccountsRestoration";
import useAppStore from "./store/useAppStore";
import useExtensionUpdate from "./hooks/useExtensionUpdate";
import useSettingsStore from "./store/useSettingsStore";
import useTheme from "./hooks/useTheme";
import useWakeLock from "./hooks/useWakeLock";
import { cn } from "./lib/utils";

function App() {
  const page = useAppStore((state) => state.page);
  const setPage = useAppStore((state) => state.setPage);

  const accounts = useAppStore((state) => state.accounts);
  const partitions = useAppStore((state) => state.partitions);
  const setPartitions = useAppStore((state) => state.setPartitions);

  const theme = useSettingsStore((state) => state.theme);
  const columns = useSettingsStore((state) => state.columns);
  const rows = useSettingsStore((state) => state.rows);

  const itemsPerPage = columns * rows;
  const pageCount = Math.ceil(partitions.length / itemsPerPage);
  const currentPage = Math.max(0, Math.min(page, pageCount - 1));

  /** Webviews */
  const webviews = useMemo(
    () => accounts.filter((item) => partitions.includes(item.partition)),
    [accounts, partitions]
  );

  /** Close Page */
  const closePage = useCallback(
    (pageIndex) => {
      setPartitions(
        partitions.filter(
          (_, index) => pageIndex !== Math.floor(index / itemsPerPage)
        )
      );
    },
    [partitions, itemsPerPage, setPartitions]
  );

  /** Close Previous Accounts */
  useAccountsRestoration();

  /** WakeLock */
  useWakeLock();

  /** Set Preferred Theme */
  useTheme(theme);

  /** Update Extension */
  useExtensionUpdate();

  return (
    <>
      {/* Application */}
      <div className="flex h-screen w-screen divide-x dark:divide-neutral-700">
        <SideMenu />
        <div className="grow overflow-clip">
          <div
            className={cn(
              "h-full grid grid-cols-(--grid-cols) auto-rows-(--auto-rows)",
              "-translate-y-(--current-page)",
              "transition-transform duration-500",
              "divide-x dark:divide-neutral-700"
            )}
            style={{
              "--current-page": `${currentPage * 100}%`,
              "--grid-cols": `repeat(${columns}, minmax(0, 1fr))`,
              "--auto-rows": `${100 / rows}%`,
            }}
          >
            {webviews.length > 0 ? (
              webviews.map((item) => (
                <Webview key={item.partition} account={item} />
              ))
            ) : (
              <div
                className={cn(
                  "flex flex-col justify-center items-center gap-4",
                  "col-span-(--col-span) row-span-(--row-span)"
                )}
                style={{
                  "--col-span": columns,
                  "--row-span": rows,
                }}
              >
                <img src={Icon} className="size-48" />
                <h1 className="text-4xl font-turret-road text-orange-500">
                  Purrfect Whiskers
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Pages */}
        <div
          className={cn(
            "shrink-0 p-2 flex flex-col gap-2",
            "overflow-auto empty:hidden"
          )}
        >
          {Array.from({ length: pageCount }).map((_, pageIndex) => (
            <div key={pageIndex} className="flex gap-1">
              <button
                className={cn(
                  "p-2 w-14 rounded-xl border border-transparent",
                  currentPage === pageIndex
                    ? [
                        "border-orange-500 bg-orange-100 text-orange-500",
                        "dark:bg-neutral-700 dark:text-orange-500",
                        "font-bold",
                      ]
                    : "bg-neutral-100 dark:bg-neutral-700"
                )}
                onClick={() => setPage(pageIndex)}
              >
                {pageIndex + 1}
              </button>

              {/* Close Page */}
              <button
                className={cn(
                  "p-2 rounded-xl border border-transparent",
                  "bg-neutral-100 dark:bg-neutral-700",
                  "hover:bg-orange-100 hover:text-orange-500",
                  "dark:hover:bg-neutral-600"
                )}
                onClick={() => closePage(pageIndex)}
              >
                <HiOutlineXMark className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          loading: {
            duration: Infinity,
          },
        }}
      />
    </>
  );
}

export default App;

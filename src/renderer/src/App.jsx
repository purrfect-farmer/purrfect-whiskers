import { useMemo, useState } from 'react'

import SideMenu from './components/SideMenu'
import Webview from './components/Webview'
import useAppStore from './store/useAppStore'
import useSettingsStore from './store/useSettingsStore'
import { cn } from './lib/utils'

function App() {
  const [page, setPage] = useState(0)
  const columns = useSettingsStore((state) => state.columns)
  const rows = useSettingsStore((state) => state.rows)
  const accounts = useAppStore((state) => state.accounts)
  const partitions = useAppStore((state) => state.partitions)

  const itemsPerPage = columns * rows
  const pageCount = Math.ceil(partitions.length / itemsPerPage)
  const currentPage = Math.min(page, pageCount - 1)

  const webviews = useMemo(
    () => accounts.filter((item) => partitions.includes(item.partition)),
    [accounts, partitions]
  )

  return (
    <div className="flex h-screen w-screen">
      <SideMenu />
      <div className="grow overflow-clip">
        <div
          className={cn(
            'h-full gap-x-1 grid grid-cols-(--grid-cols) auto-rows-(--auto-rows)',
            '-translate-y-(--current-page)',
            'transition-transform duration-500'
          )}
          style={{
            '--current-page': `${currentPage * 100}%`,
            '--grid-cols': `repeat(${columns}, minmax(0, 1fr))`,
            '--auto-rows': `${100 / rows}%`
          }}
        >
          {webviews.map((item) => (
            <Webview key={item.partition} account={item} />
          ))}
        </div>
      </div>

      {/* Pages */}
      <div className="shrink-0 w-28 p-2 flex flex-col gap-2 overflow-auto">
        {Array.from({ length: pageCount }).map((_, pageIndex) => (
          <button
            key={pageIndex}
            className={cn(
              'p-2 rounded-xl border border-transparent',
              currentPage === pageIndex
                ? 'border-blue-500 bg-blue-100 text-blue-500 font-bold'
                : 'bg-neutral-100'
            )}
            onClick={() => setPage(pageIndex)}
          >
            Page {pageIndex + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App

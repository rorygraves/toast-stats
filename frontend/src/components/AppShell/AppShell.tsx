import React, { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppShellTopBar from './AppShellTopBar'
import AppShellFooter from './AppShellFooter'
import CommandPalette from './CommandPalette'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'
import { useIsMobile } from '../../hooks/useIsMobile'

/* Per Epic #352: no notifications/help/avatar (no auth today),
   no Regions/Awards "soon" stubs. ThemeToggle now lives in the top
   bar (#565) — chrome-level controls all sit in the header.

   #422 Universal search: Cmd-K / Ctrl-K opens the CommandPalette modal
   from anywhere. The palette shares the React-Query cache with
   DistrictsPage, so it usually opens with data already in memory. */

const AppShell: React.FC = () => {
  useGoogleAnalytics()

  // <768px: drop the full footer chrome to recover above-the-fold space on
  // short pages (CC-11, Epic H #889). Its version/license meta moves to the
  // nav "About ▾" disclosure. Desktop keeps the footer.
  const isMobile = useIsMobile(768)

  const [paletteOpen, setPaletteOpen] = useState(false)
  const closePalette = useCallback(() => setPaletteOpen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="app-shell">
      <a href="#main-content" className="tm-skip-link">
        Skip to main content
      </a>
      <AppShellTopBar />
      <main id="main-content" className="app-shell__main">
        <Outlet />
      </main>
      {!isMobile && <AppShellFooter />}
      <CommandPalette isOpen={paletteOpen} onClose={closePalette} />
    </div>
  )
}

export default AppShell

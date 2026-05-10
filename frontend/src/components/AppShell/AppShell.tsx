import React from 'react'
import { Outlet } from 'react-router-dom'
import AppShellTopBar from './AppShellTopBar'
import AppShellFooter from './AppShellFooter'
import { useGoogleAnalytics } from '../../hooks/useGoogleAnalytics'

/* Per Epic #352: no notifications/help/avatar (no auth today),
   no Regions/Awards "soon" stubs. ThemeToggle stays in the footer
   so manual dark-mode access survives the chrome swap. */

const AppShell: React.FC = () => {
  useGoogleAnalytics()
  return (
    <div className="app-shell">
      <a href="#main-content" className="tm-skip-link">
        Skip to main content
      </a>
      <AppShellTopBar />
      <main id="main-content" className="app-shell__main">
        <Outlet />
      </main>
      <AppShellFooter />
    </div>
  )
}

export default AppShell

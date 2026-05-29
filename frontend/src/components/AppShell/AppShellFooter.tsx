import React from 'react'
import AppMeta from './AppMeta'

/* Footer carries the meta strip (license, version, data source) only.
   The ThemeToggle moved to AppShellTopBar in #565 — chrome-level
   controls all live in the header now. On mobile (<768px) the footer is
   dropped entirely and AppMeta surfaces behind the nav "About ▾"
   disclosure instead (#889); AppShell gates the render. */

const AppShellFooter: React.FC = () => (
  <footer role="contentinfo" className="app-shell-footer">
    <div className="app-shell-footer__inner">
      <AppMeta />
    </div>
  </footer>
)

export default AppShellFooter

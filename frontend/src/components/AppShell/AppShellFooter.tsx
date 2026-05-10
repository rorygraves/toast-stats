import React from 'react'
import ThemeToggle from '../ThemeToggle'

declare const __APP_VERSION__: string

/* The handoff design has no theme toggle (it relies on prefers-color-scheme),
   but Epic #352 keeps the manual [data-theme='dark'] toggle, so the toggle
   lives here in the footer to preserve a11y access. */

const AppShellFooter: React.FC = () => {
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

  return (
    <footer role="contentinfo" className="app-shell-footer">
      <div className="app-shell-footer__inner">
        <div>Toast Stats · ts.taverns.red · A Red Taverns production</div>
        <div className="app-shell-footer__meta">
          <span data-testid="app-version">
            Data:{' '}
            <a
              href="https://dashboards.toastmasters.org"
              target="_blank"
              rel="noopener noreferrer"
              className="app-shell-footer__link"
            >
              dashboards.toastmasters.org
            </a>
            {' · '}
            <a
              href="https://github.com/taverns-red/toast-stats/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="app-shell-footer__link"
            >
              MIT License
            </a>
            {' · '}
            {version}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}

export default AppShellFooter

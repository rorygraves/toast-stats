import React from 'react'

declare const __APP_VERSION__: string

/* Footer carries the meta strip (license, version, data source) only.
   The ThemeToggle moved to AppShellTopBar in #565 — chrome-level
   controls all live in the header now. */

const AppShellFooter: React.FC = () => {
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

  return (
    <footer role="contentinfo" className="app-shell-footer">
      <div className="app-shell-footer__inner">
        <div>
          Toast Stats · ts.taverns.red · A{' '}
          <a
            href="https://taverns.red?utm_source=toast-stats&utm_medium=footer"
            target="_blank"
            rel="noopener noreferrer"
            className="app-shell-footer__link"
          >
            Red Taverns
          </a>{' '}
          production
        </div>
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
        </div>
      </div>
    </footer>
  )
}

export default AppShellFooter

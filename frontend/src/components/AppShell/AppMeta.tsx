import React from 'react'

declare const __APP_VERSION__: string

/* The site meta strip — attribution, data source, license, build version.
   Rendered by the desktop footer (AppShellFooter) and, on mobile where the
   footer is dropped, behind the "About ▾" nav disclosure (AppShellTopBar,
   #889). Single source so the version logic and license URL never drift. */

const AppMeta: React.FC = () => {
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'

  return (
    <>
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
    </>
  )
}

export default AppMeta

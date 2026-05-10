import React from 'react'
import { NavLink, Link } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Districts', end: true },
  { to: '/awards', label: 'Awards', end: false },
  { to: '/history', label: 'History', end: false },
  { to: '/methodology', label: 'How it works', end: false },
] as const

const AppShellTopBar: React.FC = () => {
  return (
    <header className="app-shell-top-bar">
      <Link to="/" aria-label="Toast Stats home" className="app-shell-brand">
        <span aria-hidden="true" className="app-shell-brand__mark">
          TS
        </span>
        <span className="app-shell-brand__name">Toast Stats</span>
      </Link>

      <nav aria-label="Primary" className="app-shell-nav">
        <NavLink to="/" end className="app-shell-nav__link">
          Districts
        </NavLink>
        <a
          href="#regions"
          aria-disabled="true"
          tabIndex={-1}
          onClick={e => e.preventDefault()}
          className="app-shell-nav__link app-shell-nav__link--soon"
        >
          Regions
        </a>
        {NAV_ITEMS.filter(i => i.to !== '/').map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="app-shell-nav__link"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-shell-tools">
        <button
          type="button"
          className="app-shell-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 13h10l-1.5-2v-3.5a3.5 3.5 0 0 0-7 0V11L3 13Z" />
            <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
          </svg>
        </button>
        <Link
          to="/methodology"
          className="app-shell-icon-btn"
          aria-label="How it works"
          title="How it works"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="6.5" />
            <path d="M6.2 6.2a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.6.5-.6.9V10" />
            <circle cx="8" cy="12" r=".4" fill="currentColor" />
          </svg>
        </Link>
        <span
          className="app-shell-avatar"
          aria-label="Account (placeholder)"
          role="img"
        >
          TS
        </span>
      </div>
    </header>
  )
}

export default AppShellTopBar

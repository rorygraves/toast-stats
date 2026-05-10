import React from 'react'
import { NavLink, Link } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Districts', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/methodology', label: 'Methodology', end: false },
] as const

const AppShellTopBar: React.FC = () => {
  return (
    <header className="app-shell-top-bar">
      <div className="app-shell-top-bar__inner">
        <Link to="/" aria-label="Toast Stats home" className="app-shell-brand">
          <span aria-hidden="true" className="app-shell-brand__mark">
            TS
          </span>
          <span className="app-shell-brand__name">Toast Stats</span>
        </Link>

        <nav aria-label="Primary" className="app-shell-nav">
          {NAV_ITEMS.map(item => (
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
      </div>
    </header>
  )
}

export default AppShellTopBar

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Districts', end: true },
  { to: '/awards', label: 'Awards', end: false },
  { to: '/history', label: 'History', end: false },
  { to: '/methodology', label: 'How it works', end: false },
] as const

const PRIMARY_NAV_ID = 'app-shell-primary-nav'

const AppShellTopBar: React.FC = () => {
  // Mobile (<768px) disclosure: the primary nav collapses behind a
  // hamburger toggle so the 56px bar stops overflowing the viewport at
  // 375px (#735). On desktop the nav is always inline and `navOpen` is
  // inert — CSS shows the row and hides the toggle.
  const [navOpen, setNavOpen] = useState(false)
  const closeNav = useCallback(() => setNavOpen(false), [])
  const headerRef = useRef<HTMLElement>(null)
  const location = useLocation()

  // Close on route change — covers browser back/forward, not just link taps
  // (link taps also call closeNav). React's sanctioned "adjust state when a
  // value changes during render" pattern (a tracked-state compare, not a
  // setState-in-effect which would cascade-render, nor a ref read in render).
  const [trackedPath, setTrackedPath] = useState(location.pathname)
  if (trackedPath !== location.pathname) {
    setTrackedPath(location.pathname)
    setNavOpen(false)
  }

  // Escape closes; outside-click closes. Bound only while open so we
  // don't keep idle global listeners on every page.
  useEffect(() => {
    if (!navOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    const onPointerDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setNavOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [navOpen])

  return (
    <header className="app-shell-top-bar" ref={headerRef}>
      <button
        type="button"
        className="app-shell-nav-toggle"
        aria-label="Menu"
        aria-controls={PRIMARY_NAV_ID}
        aria-expanded={navOpen}
        onClick={() => setNavOpen(prev => !prev)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {navOpen ? (
            <>
              <path d="M5 5l10 10" />
              <path d="M15 5L5 15" />
            </>
          ) : (
            <>
              <path d="M3 6h14" />
              <path d="M3 10h14" />
              <path d="M3 14h14" />
            </>
          )}
        </svg>
      </button>

      <Link to="/" aria-label="Toast Stats home" className="app-shell-brand">
        <span aria-hidden="true" className="app-shell-brand__mark">
          TS
        </span>
        <span className="app-shell-brand__name">Toast Stats</span>
      </Link>

      <nav
        id={PRIMARY_NAV_ID}
        aria-label="Primary"
        className="app-shell-nav"
        data-open={navOpen}
      >
        <NavLink to="/" end className="app-shell-nav__link" onClick={closeNav}>
          Districts
        </NavLink>
        <NavLink
          to="/regions"
          className="app-shell-nav__link"
          onClick={closeNav}
        >
          Regions
        </NavLink>
        {NAV_ITEMS.filter(i => i.to !== '/').map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="app-shell-nav__link"
            onClick={closeNav}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-shell-tools">
        {/* Bell stub removed per #411 — a non-functional icon erodes
            trust. Re-add when there's real notification content. */}
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
        <ThemeToggle />
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

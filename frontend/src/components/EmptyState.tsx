import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface EmptyStateProps {
  /** Short headline, e.g. "No districts here yet". */
  title: string
  /** One-line explanation of why the surface is empty. */
  message: string
  /** Label for the primary recovery action. */
  actionLabel: string
  /** Router destination for the recovery action. */
  actionHref: string
  /** Optional decorative icon; a default compass glyph is used otherwise. */
  icon?: ReactNode
}

/**
 * EmptyState — a shared recovery affordance for empty / error surfaces (CC-10).
 *
 * Replaces bare-prose dead-ends with a card: a decorative icon, a one-line
 * explanation, and a primary action rendered as a real, 44px-tall button
 * (`<Link>` styled as a button) so the user always has a tappable way out.
 * See docs/design/mobile-ux-audit-2026-05-28.md §CC-10.
 */
export function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <span className="empty-state__icon">{icon ?? <DefaultIcon />}</span>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__message">{message}</p>
      <Link to={actionHref} className="empty-state__action">
        {actionLabel}
      </Link>
    </div>
  )
}

function DefaultIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5 11 11l-1.5 3.5L13 13l1.5-3.5z" />
    </svg>
  )
}

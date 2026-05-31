import React from 'react'
import { Link } from 'react-router-dom'
import type {
  DiffEvent,
  DiffEventCategory,
} from '@toastmasters/shared-contracts'

/* District "What Changed" feed group (#1013, epic #1007 — club links).
   Extracted from DistrictChangesPage so the link logic can be unit-tested
   directly without a full page mount (R22). Every DiffEvent.label is a
   pre-rendered sentence that BEGINS with the club name (see diffSnapshots:
   membership/dcp/distinguished labels are `${name} …`; roster labels are
   `${name} (${status}) joined/left the roster`). We link just that leading
   club-name token to the club's detail page and keep the rest of the sentence
   as plain text — only the name is the link, not the whole prose. districtId
   is the route param the page owns and passes down (R3) — never re-derived
   from event data; only clubId comes from each event. */

/** One change line: club name linked, the rest of the label as plain text.
    Falls back to plain text for a club-less (district-level) event, or when a
    label unexpectedly doesn't begin with the club name — so a link is only
    ever rendered when it points somewhere real. */
const ChangeLabel: React.FC<{ event: DiffEvent; districtId: string }> = ({
  event,
  districtId,
}) => {
  const { clubId, clubName, label } = event
  const linkable =
    !!clubId && !!clubName && !!districtId && label.startsWith(clubName)

  if (!linkable) return <>{label}</>

  const rest = label.slice(clubName.length)
  return (
    <>
      <Link
        to={`/district/${districtId}/club/${clubId}`}
        className="clubs-name-link"
      >
        {clubName}
      </Link>
      {rest}
    </>
  )
}

export const ChangeGroup: React.FC<{
  category: DiffEventCategory
  heading: string
  events: DiffEvent[]
  /** Route district id, owned by the page and passed down (R3). */
  districtId: string
  /** Groups are open by default; collapsed when listed in ?expandChanges (#980). */
  collapsed: boolean
  onToggle: (category: DiffEventCategory, open: boolean) => void
}> = ({ category, heading, events, districtId, collapsed, onToggle }) => {
  if (events.length === 0) return null
  return (
    <details
      className="changes-group"
      open={!collapsed}
      onToggle={e => onToggle(category, e.currentTarget.open)}
    >
      <summary className="changes-group__summary">
        {heading}{' '}
        <span className="changes-group__count">({events.length})</span>
      </summary>
      <ul className="changes-group__list">
        {events.map(e => (
          <li key={`${e.category}-${e.clubId}`} className="changes-group__item">
            <ChangeLabel event={e} districtId={districtId} />
          </li>
        ))}
      </ul>
    </details>
  )
}

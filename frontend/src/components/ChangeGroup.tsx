import React from 'react'
import { Link } from 'react-router-dom'
import type {
  DiffEvent,
  DiffEventCategory,
} from '@toastmasters/shared-contracts'

/* District "What Changed" feed group (#1013/#1014, epic #1007 — entity links).
   Extracted from DistrictChangesPage so the link logic can be unit-tested
   directly without a full page mount (R22). Every DiffEvent.label is a
   pre-rendered sentence that BEGINS with its entity's display name — the club
   name for club events (membership/dcp/distinguished/roster), or `entityName`
   ("Division G" / "Area 2") for area/division status events (#1014). We link
   just that leading name token to the entity's scoped route and keep the rest
   of the sentence as plain text. districtId is the route param the page owns
   and passes down (R3); the entity id/name come from each event. */

/** The display name + scoped route for an event's entity, or null when the
    event has no linkable target (an aggregate/district-level line, or an area
    event missing its division ref — degrade gracefully to text, never a broken
    link). */
function resolveEntity(
  event: DiffEvent,
  districtId: string
): { name: string; href: string } | null {
  if (!districtId) return null
  const { clubId, clubName, divisionId, areaId, entityName } = event

  // Club-scoped event (the Phase-1 default).
  if (clubId && clubName) {
    return { name: clubName, href: `/district/${districtId}/club/${clubId}` }
  }
  // Area status event → division-scoped area route (#1008). Needs both refs.
  if (event.category === 'area-status' && areaId && divisionId && entityName) {
    return {
      name: entityName,
      href: `/district/${districtId}/division/${divisionId}/area/${areaId}`,
    }
  }
  // Division status event → division-scoped route (#1008).
  if (event.category === 'division-status' && divisionId && entityName) {
    return {
      name: entityName,
      href: `/district/${districtId}/division/${divisionId}`,
    }
  }
  return null
}

/** One change line: the leading entity name linked, the rest of the label as
    plain text. Falls back to plain text for an entity-less event, or when a
    label unexpectedly doesn't begin with the entity name — so a link is only
    ever rendered when it points somewhere real. */
const ChangeLabel: React.FC<{ event: DiffEvent; districtId: string }> = ({
  event,
  districtId,
}) => {
  const { label } = event
  const entity = resolveEntity(event, districtId)

  if (!entity || !label.startsWith(entity.name)) return <>{label}</>

  const rest = label.slice(entity.name.length)
  return (
    <>
      <Link to={entity.href} className="clubs-name-link">
        {entity.name}
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
          <li
            key={`${e.category}-${e.clubId || e.divisionId || ''}-${e.areaId ?? ''}`}
            className="changes-group__item"
          >
            <ChangeLabel event={e} districtId={districtId} />
          </li>
        ))}
      </ul>
    </details>
  )
}

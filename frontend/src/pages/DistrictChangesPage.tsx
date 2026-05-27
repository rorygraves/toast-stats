import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useSnapshotDiff, previousRecordedDate } from '../hooks/useSnapshotDiff'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { DistrictSubnav } from '../components/DistrictSubnav'
import { KpiDeltaCard } from '../components/KpiDeltaCard'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import ErrorBoundary from '../components/ErrorBoundary'
import type {
  DiffEvent,
  DiffEventCategory,
} from '@toastmasters/shared-contracts'

/* District "What Changed" page (#793, epic #797 Sprint 1, ADR-005 §1).
   Default digest — what changed between the district's previous recorded
   snapshot date and the latest one. No date picker yet (Phase 2, #794); the
   from/to pair is owned here and passed to useSnapshotDiff as props (R3). */

/** Human-friendly date, e.g. "May 25, 2026". Date-only, UTC-safe. */
function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

/* Display order + headings for the grouped change list. Roster moves first
   (most material), then recognition, then the per-club metric churn. */
const CATEGORY_GROUPS: { category: DiffEventCategory; heading: string }[] = [
  { category: 'club-added', heading: 'Clubs that joined' },
  { category: 'club-removed', heading: 'Clubs that left' },
  { category: 'distinguished', heading: 'Distinguished status changes' },
  { category: 'membership', heading: 'Membership changes' },
  { category: 'dcp-goals', heading: 'DCP goal changes' },
]

const ChangeGroup: React.FC<{ heading: string; events: DiffEvent[] }> = ({
  heading,
  events,
}) => {
  if (events.length === 0) return null
  return (
    <details className="changes-group" open>
      <summary className="changes-group__summary">
        {heading}{' '}
        <span className="changes-group__count">({events.length})</span>
      </summary>
      <ul className="changes-group__list">
        {events.map(e => (
          <li key={`${e.category}-${e.clubId}`} className="changes-group__item">
            {e.label}
          </li>
        ))}
      </ul>
    </details>
  )
}

const DistrictChangesPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()

  const { data: districtsData } = useDistricts()
  const selectedDistrict = districtsData?.districts?.find(
    d => d.id === districtId
  )
  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName
  useDocumentTitle(districtName ? `${districtName} — What Changed` : null)

  const { data: cachedDates, isLoading: datesLoading } = useDistrictCachedDates(
    districtId || ''
  )
  const dates = useMemo(() => cachedDates?.dates ?? [], [cachedDates?.dates])
  const pair = useMemo(() => previousRecordedDate(dates), [dates])

  const {
    data: diff,
    isLoading: diffLoading,
    isError,
  } = useSnapshotDiff(districtId, pair?.from, pair?.to)

  const eventsByCategory = useMemo(() => {
    const map = new Map<DiffEventCategory, DiffEvent[]>()
    for (const e of diff?.events ?? []) {
      const list = map.get(e.category) ?? []
      list.push(e)
      map.set(e.category, list)
    }
    return map
  }, [diff?.events])

  if (!districtId) return null

  const enoughHistory = !datesLoading && dates.length >= 2
  const onlyOneSnapshot = !datesLoading && dates.length < 2

  return (
    <ErrorBoundary>
      <div className="district-detail-page-root">
        <div className="district-detail-page">
          <h1 className="district-changes__title">{districtName}</h1>

          <SubpageBreadcrumb
            crumbs={[{ label: districtName, to: `/district/${districtId}` }]}
          />

          <DistrictSubnav districtId={districtId} />

          <section aria-label="What changed" className="district-changes">
            {onlyOneSnapshot && (
              <p
                className="district-changes__empty"
                data-testid="changes-single"
              >
                Only one snapshot has been recorded for {districtName} so far. A
                change digest needs at least two recorded dates — check back
                after the next update.
              </p>
            )}

            {enoughHistory && (datesLoading || diffLoading) && (
              <LoadingSkeleton variant="card" height="220px" />
            )}

            {enoughHistory && isError && (
              <p
                className="district-changes__empty"
                data-testid="changes-error"
              >
                Couldn’t load the change digest for {districtName}. Please try
                again.
              </p>
            )}

            {diff && (
              <>
                <p
                  className="district-changes__headline"
                  data-testid="changes-headline"
                >
                  Changes for {districtName} from {fmtDate(diff.from.date)} to{' '}
                  {fmtDate(diff.to.date)}
                  {diff.dayCount > 0 &&
                    ` · ${diff.dayCount} day${diff.dayCount === 1 ? '' : 's'}`}
                </p>

                <div className="district-changes__kpis">
                  <KpiDeltaCard
                    title="Membership"
                    current={diff.totals.membership.delta}
                    secondaryLabel={`${diff.totals.membership.from.toLocaleString()} → ${diff.totals.membership.to.toLocaleString()}`}
                  />
                  <KpiDeltaCard
                    title="Payments"
                    current={diff.totals.payments.delta}
                    secondaryLabel={`${diff.totals.payments.from.toLocaleString()} → ${diff.totals.payments.to.toLocaleString()}`}
                  />
                  <KpiDeltaCard
                    title="Clubs"
                    current={diff.totals.clubCount.delta}
                    secondaryLabel={`${diff.totals.clubCount.from.toLocaleString()} → ${diff.totals.clubCount.to.toLocaleString()}`}
                  />
                  <KpiDeltaCard
                    title="Distinguished clubs"
                    current={diff.totals.distinguished.delta}
                    secondaryLabel={`${diff.totals.distinguished.from.toLocaleString()} → ${diff.totals.distinguished.to.toLocaleString()}`}
                  />
                </div>

                {diff.events.length === 0 ? (
                  <p
                    className="district-changes__empty"
                    data-testid="changes-none"
                  >
                    No recorded changes between these two dates.
                  </p>
                ) : (
                  <div
                    className="district-changes__list"
                    data-testid="changes-list"
                  >
                    {CATEGORY_GROUPS.map(({ category, heading }) => (
                      <ChangeGroup
                        key={category}
                        heading={heading}
                        events={eventsByCategory.get(category) ?? []}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictChangesPage

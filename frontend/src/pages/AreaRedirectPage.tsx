/* AreaRedirectPage (#1017) — flat, shareable area URL.

   Resolves the flat `/district/:districtId/area/:areaId` to the canonical nested
   route `/district/:districtId/division/:divId/area/:areaId`. The division is
   resolved by looking the area up in the same divisions snapshot AreaPage reads
   (one source of truth — R3/R8; the division is NEVER string-parsed off the area
   id). Mirrors the ClubRedirectPage pattern (#320): the nested route stays
   canonical, this is a memorable alias (operator example: /district/61/area/A1).

   A bad area id (no division owns it, once the snapshot has loaded) throws a 404
   to the branded error page (#1011/#1012), exactly like the nested AreaPage. */

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { EmptyState } from '../components/ErrorDisplay'

const AreaRedirectPage: React.FC = () => {
  const { districtId, areaId } = useParams<{
    districtId: string
    areaId: string
  }>()
  const navigate = useNavigate()

  const {
    data: snapshot,
    isLoading,
    error,
  } = useDistrictStatistics(districtId ?? '', undefined, 'divisions')

  const normalizedAreaId = areaId?.toUpperCase()
  // Resolve BOTH the canonical division id AND the canonical area id from the
  // snapshot (the source of truth), so a mixed-case alias like /area/a1 lands on
  // a properly-cased canonical URL — the point of a shareable shortcut. Pass the
  // snapshot's as-of date so historical snapshots gate correctly (R3), matching
  // AreaPage's own lookup so the alias resolves the same division.
  const target = React.useMemo(() => {
    if (!snapshot || !normalizedAreaId) return undefined
    const divisions = extractDivisionPerformance(snapshot, snapshot.asOfDate)
    const division = divisions.find(d =>
      d.areas.some(a => a.areaId.toUpperCase() === normalizedAreaId)
    )
    const area = division?.areas.find(
      a => a.areaId.toUpperCase() === normalizedAreaId
    )
    return division && area
      ? { divId: division.divisionId, areaId: area.areaId }
      : undefined
  }, [snapshot, normalizedAreaId])

  React.useEffect(() => {
    if (target && districtId) {
      navigate(
        `/district/${districtId}/division/${target.divId}/area/${target.areaId}`,
        { replace: true }
      )
    }
  }, [target, districtId, navigate])

  if (isLoading) {
    return <LoadingSkeleton variant="card" />
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load area"
        message="The district analytics file is unavailable. Try again in a moment."
        icon="data"
      />
    )
  }

  // Snapshot loaded but no division owns this area → bad slug → branded 404,
  // never 404 while loading/errored (data-unavailable ≠ not-found).
  if (snapshot && !target) {
    throw new Response(null, { status: 404, statusText: 'Area not found' })
  }

  // target resolved — the effect is navigating; show a brief skeleton meanwhile.
  return <LoadingSkeleton variant="card" />
}

export default AreaRedirectPage

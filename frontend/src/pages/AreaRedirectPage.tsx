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
  const divId = React.useMemo(() => {
    if (!snapshot || !normalizedAreaId) return undefined
    // Pass the snapshot's as-of date so historical snapshots gate correctly (R3),
    // matching AreaPage's own lookup so the alias resolves the same division.
    return extractDivisionPerformance(snapshot, snapshot.asOfDate).find(d =>
      d.areas.some(a => a.areaId.toUpperCase() === normalizedAreaId)
    )?.divisionId
  }, [snapshot, normalizedAreaId])

  React.useEffect(() => {
    if (divId && districtId && areaId) {
      navigate(`/district/${districtId}/division/${divId}/area/${areaId}`, {
        replace: true,
      })
    }
  }, [divId, districtId, areaId, navigate])

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
  if (snapshot && !divId) {
    throw new Response(null, { status: 404, statusText: 'Area not found' })
  }

  // divId resolved — the effect is navigating; show a brief skeleton meanwhile.
  return <LoadingSkeleton variant="card" />
}

export default AreaRedirectPage

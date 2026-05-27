import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useDistrictAnalytics } from '../hooks/useDistrictAnalytics'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
} from '../utils/programYear'
import { extractEducationLevels } from '../utils/extractEducationLevels'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { DistrictSubnav } from '../components/DistrictSubnav'
import { TopGrowthClubs } from '../components/TopGrowthClubs'
import { EducationLevelsCard } from '../components/EducationLevelsCard'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import ErrorBoundary from '../components/ErrorBoundary'

/* District Analytics Page (#680, epic #674 Sprint 6, ADR-005 §1/§2).
   Dedicated deep-linkable route for the full Top-Growth / Top-DCP-achiever
   lists and the education-levels rollup that previously lived on the Overview
   hub. ADR-005 §2 deliberately gives Analytics its OWN route (not a hub fold)
   so the subnav's "Analytics" item is a real destination. Logic lifted from
   DistrictDetailPage unchanged; PY / as-of-date state is URL-synced via
   useUrlProgramYear. */

const DistrictAnalyticsPage: React.FC = () => {
  const { districtId } = useParams<{ districtId: string }>()

  const {
    selectedProgramYear,
    setSelectedProgramYear,
    selectedDate,
    setSelectedDate,
  } = useUrlProgramYear()

  const { data: districtsData } = useDistricts()
  const selectedDistrict = districtsData?.districts?.find(
    d => d.id === districtId
  )

  const { data: cachedDatesData } = useDistrictCachedDates(districtId || '')
  const allCachedDates = useMemo(
    () => cachedDatesData?.dates || [],
    [cachedDatesData?.dates]
  )
  const availableProgramYears = useMemo(
    () => getAvailableProgramYears(allCachedDates),
    [allCachedDates]
  )

  React.useEffect(() => {
    if (availableProgramYears.length > 0) {
      const has = availableProgramYears.some(
        py => py.year === selectedProgramYear.year
      )
      if (!has) {
        const mostRecent = availableProgramYears[0]
        if (mostRecent) setSelectedProgramYear(mostRecent)
      }
    }
  }, [availableProgramYears, selectedProgramYear.year, setSelectedProgramYear])

  const cachedDatesInProgramYear = useMemo(
    () => filterDatesByProgramYear(allCachedDates, selectedProgramYear),
    [allCachedDates, selectedProgramYear]
  )

  const effectiveProgramYear = useMemo(() => {
    if (availableProgramYears.length === 0) return null
    const has = availableProgramYears.some(
      py => py.year === selectedProgramYear.year
    )
    if (has) return selectedProgramYear
    return availableProgramYears[0] ?? null
  }, [availableProgramYears, selectedProgramYear])

  const effectiveEndDate = useMemo(() => {
    if (!effectiveProgramYear) return null
    if (
      selectedDate &&
      isDateInProgramYear(selectedDate, effectiveProgramYear)
    ) {
      return selectedDate
    }
    const mostRecent = getMostRecentDateInProgramYear(
      allCachedDates,
      effectiveProgramYear
    )
    return mostRecent || effectiveProgramYear.endDate
  }, [selectedDate, effectiveProgramYear, allCachedDates])

  const hasValidDates =
    effectiveProgramYear !== null && effectiveEndDate !== null

  const { data: analytics, isLoading: isLoadingAnalytics } =
    useDistrictAnalytics(
      hasValidDates ? districtId || null : null,
      effectiveProgramYear?.startDate,
      effectiveEndDate ?? undefined
    )

  const { data: districtStatistics } = useDistrictStatistics(
    hasValidDates ? districtId || null : null,
    effectiveEndDate ?? undefined,
    'divisions'
  )

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName
  useDocumentTitle(districtName ? `${districtName} Analytics` : null)

  const availableDates = cachedDatesInProgramYear.sort((a, b) =>
    b.localeCompare(a)
  )

  // Top DCP achievers — derive from each club's latest dcpGoalsTrend point.
  // DCP goals are independent (not sequential); we read the achieved-count
  // straight off the raw trend, never inferring Goals 1-N. Sorted desc and
  // capped at 10. (Lifted from DistrictDetailPage unchanged.)
  const topDCPClubs = useMemo(() => {
    if (!analytics) return []
    return analytics.allClubs
      .filter(club => club.dcpGoalsTrend.length > 0)
      .map(club => ({
        clubId: club.clubId,
        clubName: club.clubName,
        goalsAchieved:
          club.dcpGoalsTrend[club.dcpGoalsTrend.length - 1]?.goalsAchieved || 0,
        ...(club.distinguishedLevel &&
          ['Smedley', 'President', 'Select', 'Distinguished'].includes(
            club.distinguishedLevel
          ) && {
            distinguishedLevel: club.distinguishedLevel as
              | 'Smedley'
              | 'President'
              | 'Select'
              | 'Distinguished',
          }),
      }))
      .sort((a, b) => b.goalsAchieved - a.goalsAchieved)
      .slice(0, 10)
  }, [analytics])

  if (!districtId) {
    return null
  }

  return (
    <ErrorBoundary>
      <div className="district-detail-page-root">
        <div className="district-detail-page">
          <DistrictDetailHeader
            districtId={districtId}
            districtName={districtName}
            selectedProgramYear={selectedProgramYear}
            setSelectedProgramYear={setSelectedProgramYear}
            availableProgramYears={availableProgramYears}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            availableDates={availableDates}
            latestSnapshotDate={
              cachedDatesData?.dateRange?.endDate ?? availableDates[0]
            }
          />

          <SubpageBreadcrumb
            crumbs={[{ label: districtName, to: `/district/${districtId}` }]}
          />

          <DistrictSubnav districtId={districtId} />

          <section
            aria-label="District analytics"
            className="space-y-4 sm:space-y-6"
          >
            {analytics ? (
              <TopGrowthClubs
                topGrowthClubs={analytics.topGrowthClubs}
                topDCPClubs={topDCPClubs}
                isLoading={isLoadingAnalytics}
              />
            ) : (
              isLoadingAnalytics && <LoadingSkeleton variant="card" />
            )}

            {/* Education-levels rollup (#426) — historically part of the
                Analytics tab; lives here on the dedicated route, keeping the
                hub lean. Skips its own render when all totals are 0. */}
            {districtStatistics && (
              <EducationLevelsCard
                totals={extractEducationLevels(districtStatistics)}
              />
            )}
          </section>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictAnalyticsPage

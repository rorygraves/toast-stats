import React, { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useDistricts } from '../hooks/useDistricts'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useDistrictCachedDates } from '../hooks/useDistrictData'
import { useDistrictStatistics } from '../hooks/useMembershipData'
import { useUrlProgramYear } from '../hooks/useUrlProgramYear'
import {
  getAvailableProgramYears,
  filterDatesByProgramYear,
  getMostRecentDateInProgramYear,
  isDateInProgramYear,
} from '../utils/programYear'
import { extractDivisionPerformance } from '../utils/extractDivisionPerformance'
import { DistrictDetailHeader } from '../components/DistrictDetailHeader'
import { SubpageBreadcrumb } from '../components/SubpageBreadcrumb'
import { DistrictSubnav } from '../components/DistrictSubnav'
import { DivisionPerformanceCards } from '../components/DivisionPerformanceCards'
import DistinguishedProgramCriteriaExplainer from '../components/DistinguishedProgramCriteriaExplainer'
import { DivisionAreaRecognitionPanel } from '../components/DivisionAreaRecognitionPanel'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import ErrorBoundary from '../components/ErrorBoundary'

/* District Divisions Page (#571, epic #568 Phase 3).
   Dedicated route for the divisions / areas subview. Shows DDP criteria,
   per-division performance cards, and the area-level recognition panel.
   Reused from the previous Divisions tab body in DistrictDetailPage. */

const DistrictDivisionsPage: React.FC = () => {
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

  const { data: districtStatistics, isLoading: isLoadingStatistics } =
    useDistrictStatistics(
      hasValidDates ? districtId || null : null,
      effectiveEndDate ?? undefined,
      'divisions'
    )

  const rawName = selectedDistrict?.name || districtId || ''
  const districtName = /^\d+$/.test(rawName) ? `District ${rawName}` : rawName
  useDocumentTitle(districtName ? `${districtName} Divisions` : null)

  const availableDates = cachedDatesInProgramYear.sort((a, b) =>
    b.localeCompare(a)
  )

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

          <div className="space-y-4 sm:space-y-6">
            {districtStatistics ? (
              <DivisionPerformanceCards
                districtSnapshot={districtStatistics}
                isLoading={isLoadingStatistics}
                snapshotTimestamp={districtStatistics.asOfDate}
                districtId={districtId}
              />
            ) : (
              isLoadingStatistics && <LoadingSkeleton variant="card" />
            )}

            <DistinguishedProgramCriteriaExplainer />

            {districtStatistics ? (
              <DivisionAreaRecognitionPanel
                divisions={extractDivisionPerformance(
                  districtStatistics,
                  districtStatistics.asOfDate
                )}
                isLoading={isLoadingStatistics}
              />
            ) : (
              isLoadingStatistics && (
                <LoadingSkeleton variant="table" count={3} />
              )
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default DistrictDivisionsPage

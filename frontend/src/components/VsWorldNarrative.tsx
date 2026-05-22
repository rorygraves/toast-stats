import React from 'react'
import { Link } from 'react-router-dom'
import { useGlobalRankings } from '../hooks/useGlobalRankings'
import type { ProgramYear } from '../utils/programYear'

/* District IA Phase 3 (#571) — inline "Vs world" callout on the
   narrative landing page. Shows four mini rank tiles (Paid, Payments,
   Distinguished, Aggregate) and links to /district/:id/rankings for
   the progression chart + multi-year table. */

export interface VsWorldNarrativeProps {
  districtId: string
  districtName: string
  selectedProgramYear?: ProgramYear
}

interface MiniRankProps {
  label: string
  rank: number | null | undefined
  total: number | null | undefined
}

const MiniRank: React.FC<MiniRankProps> = ({ label, rank, total }) => (
  <div className="flex flex-col items-center justify-center px-3 py-2 rounded-md tm-bg-cool-gray-20 min-w-[110px]">
    <span className="text-xs font-tm-body tm-text-cool-gray">{label}</span>
    <span className="text-lg font-tm-headline font-semibold tm-text-loyal-blue">
      {typeof rank === 'number' && rank > 0 ? `#${rank}` : '—'}
    </span>
    {typeof total === 'number' && total > 0 && (
      <span className="text-xs font-tm-body tm-text-cool-gray">of {total}</span>
    )}
  </div>
)

const VsWorldNarrative: React.FC<VsWorldNarrativeProps> = ({
  districtId,
  districtName,
  selectedProgramYear,
}) => {
  const hookParams: {
    districtId: string
    selectedProgramYear?: ProgramYear
  } = { districtId }
  if (selectedProgramYear) hookParams.selectedProgramYear = selectedProgramYear

  const { endOfYearRankings, isLoading, isError } =
    useGlobalRankings(hookParams)

  if (isLoading || isError || !endOfYearRankings) return null

  return (
    <section aria-labelledby="vs-world-heading" className="redesign-panel">
      <header className="flex items-center justify-between gap-3 mb-3">
        <h2
          id="vs-world-heading"
          className="tm-h2 tm-text-loyal-blue font-tm-headline"
        >
          {districtName} vs world
        </h2>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniRank
          label="Paid"
          rank={endOfYearRankings.paidClubs?.rank}
          total={endOfYearRankings.paidClubs?.totalDistricts}
        />
        <MiniRank
          label="Payments"
          rank={endOfYearRankings.membershipPayments?.rank}
          total={endOfYearRankings.membershipPayments?.totalDistricts}
        />
        <MiniRank
          label="Distinguished"
          rank={endOfYearRankings.distinguishedClubs?.rank}
          total={endOfYearRankings.distinguishedClubs?.totalDistricts}
        />
        <MiniRank
          label="Aggregate"
          rank={endOfYearRankings.overall?.rank}
          total={endOfYearRankings.overall?.totalDistricts}
        />
      </div>

      <div className="mt-3 text-right">
        <Link
          to={`/district/${districtId}/rankings`}
          className="text-tm-loyal-blue hover:underline font-tm-headline font-medium"
        >
          See progression →
        </Link>
      </div>
    </section>
  )
}

export default VsWorldNarrative

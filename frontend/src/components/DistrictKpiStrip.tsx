import React, { useCallback, useEffect, useState } from 'react'
import { KpiBulletCard } from './KpiBulletCard'
import { KpiDeltaCard } from './KpiDeltaCard'
import type { MetricRankings, RecognitionTargets } from '../types/districts'

/* #572 — sticky KPI strip extracted from DistrictOverview.

   Presentational: takes already-loaded KPI values + targets and
   renders three tier-progress KpiBulletCards plus a signed-delta
   KpiDeltaCard (Net Member Change, #681) inside a sticky region,
   with a legend expanding the bullet-bar D/S/P/Sm tier markers.
   Mobile gets a chevron that collapses the strip into a single
   compact summary row; the collapsed state persists in
   sessionStorage for the rest of the tab session. */

export interface DistrictKpiCardData {
  current: number
  targets: RecognitionTargets | null
  rankings: MetricRankings
}

/** Net Member Change is a signed delta with no Distinguished tiers, so it
 *  carries only a current value — not targets/rankings (#681). */
export interface DistrictKpiDeltaData {
  current: number
}

export interface DistrictKpiStripData {
  paidClubs: DistrictKpiCardData
  membershipPayments: DistrictKpiCardData
  distinguishedClubs: DistrictKpiCardData
  netMemberChange: DistrictKpiDeltaData
}

export interface DistrictKpiStripProps {
  kpis: DistrictKpiStripData | null
}

const STORAGE_KEY = 'district-kpi-strip-collapsed'

const readInitialCollapsed = (): boolean => {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const formatCompact = (n: number): string => {
  if (Math.abs(n) >= 1000) {
    const k = n / 1000
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`
  }
  return String(n)
}

// Signed compact form for the collapsed summary: +312 / −1.2K / 0.
const formatSignedCompact = (n: number): string => {
  if (n === 0) return '0'
  const sign = n > 0 ? '+' : '−'
  return `${sign}${formatCompact(Math.abs(n))}`
}

// Legend expanding the bullet-bar tier abbreviations (#681). Without this the
// D/S/P/Sm ticks are cryptic — the meaning was only reachable on hover.
const TIER_LEGEND: { short: string; full: string }[] = [
  { short: 'D', full: 'Distinguished' },
  { short: 'S', full: 'Select' },
  { short: 'P', full: "President's" },
  { short: 'Sm', full: 'Smedley' },
]

export const DistrictKpiStrip: React.FC<DistrictKpiStripProps> = ({ kpis }) => {
  const [collapsed, setCollapsed] = useState<boolean>(readInitialCollapsed)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      /* sessionStorage may throw in private modes; degrade silently. */
    }
  }, [collapsed])

  const toggle = useCallback(() => setCollapsed(prev => !prev), [])

  if (!kpis) {
    return (
      <section
        aria-label="District KPI strip"
        className="district-kpi-strip district-kpi-strip--loading"
        data-testid="district-kpi-strip-skeleton"
      >
        <div className="district-kpi-strip__skeleton" aria-hidden="true" />
      </section>
    )
  }

  return (
    <section
      aria-labelledby="district-kpi-strip-heading"
      className={`district-kpi-strip${
        collapsed ? ' district-kpi-strip--collapsed' : ''
      }`}
    >
      <h2 id="district-kpi-strip-heading" className="sr-only">
        Key district metrics
      </h2>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="district-kpi-strip-body"
        aria-label={collapsed ? 'Expand KPI strip' : 'Collapse KPI strip'}
        className="district-kpi-strip__toggle"
      >
        <span aria-hidden="true">{collapsed ? '▾' : '▴'}</span>
      </button>

      {collapsed ? (
        <div
          id="district-kpi-strip-body"
          className="district-kpi-strip__summary"
          data-testid="district-kpi-strip-summary"
        >
          <span>
            <strong>Paid</strong> {formatCompact(kpis.paidClubs.current)}
          </span>
          <span aria-hidden="true" className="district-kpi-strip__sep">
            ·
          </span>
          <span>{formatCompact(kpis.membershipPayments.current)} pmts</span>
          <span aria-hidden="true" className="district-kpi-strip__sep">
            ·
          </span>
          <span>{formatCompact(kpis.distinguishedClubs.current)} dist.</span>
          <span aria-hidden="true" className="district-kpi-strip__sep">
            ·
          </span>
          <span>{formatSignedCompact(kpis.netMemberChange.current)} net</span>
        </div>
      ) : (
        <div
          id="district-kpi-strip-body"
          className="district-kpi-strip__expanded"
        >
          <div className="district-kpi-strip__cards">
            <KpiBulletCard
              title="Paid Clubs"
              current={kpis.paidClubs.current}
              targets={kpis.paidClubs.targets}
              rankings={kpis.paidClubs.rankings}
              tooltipContent="Paid clubs count with thresholds for each Distinguished District recognition level."
            />
            <KpiBulletCard
              title="Membership Payments"
              current={kpis.membershipPayments.current}
              targets={kpis.membershipPayments.targets}
              rankings={kpis.membershipPayments.rankings}
              tooltipContent="Total membership payments (New + April + October + Late + Charter) with thresholds for each recognition level."
            />
            <KpiBulletCard
              title="Distinguished Clubs"
              current={kpis.distinguishedClubs.current}
              targets={kpis.distinguishedClubs.targets}
              rankings={kpis.distinguishedClubs.rankings}
              tooltipContent="Clubs achieving DCP goals + membership requirements with thresholds for each recognition level."
            />
            <KpiDeltaCard
              title="Net Member Change"
              current={kpis.netMemberChange.current}
              secondaryLabel="payments vs. program-year base"
              tooltipContent="Membership payments minus the program-year payment base (the recognition baseline). This differs from the Trends 'Net Change', which compares member counts against the first snapshot of the year."
            />
          </div>
          <p
            className="district-kpi-strip__legend"
            data-testid="district-kpi-strip-legend"
          >
            <span className="district-kpi-strip__legend-label">
              Tier markers:
            </span>
            {TIER_LEGEND.map((t, i) => (
              <span key={t.short} className="district-kpi-strip__legend-item">
                {i > 0 && (
                  <span aria-hidden="true" className="district-kpi-strip__sep">
                    ·
                  </span>
                )}
                <strong>{t.short}</strong> {t.full}
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  )
}

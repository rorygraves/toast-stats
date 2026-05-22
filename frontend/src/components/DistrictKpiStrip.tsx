import React, { useCallback, useEffect, useState } from 'react'
import { KpiBulletCard } from './KpiBulletCard'
import type { MetricRankings, RecognitionTargets } from '../types/districts'

/* #572 — sticky KPI strip extracted from DistrictOverview.

   Presentational: takes already-loaded KPI values + targets and
   renders three KpiBulletCards inside a sticky-positioned region.
   Mobile gets a chevron that collapses the strip into a single
   compact summary row; the collapsed state persists in
   sessionStorage for the rest of the tab session. */

export interface DistrictKpiCardData {
  current: number
  targets: RecognitionTargets | null
  rankings: MetricRankings
}

export interface DistrictKpiStripData {
  paidClubs: DistrictKpiCardData
  membershipPayments: DistrictKpiCardData
  distinguishedClubs: DistrictKpiCardData
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
      aria-label="District KPI strip"
      className={`district-kpi-strip${
        collapsed ? ' district-kpi-strip--collapsed' : ''
      }`}
    >
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
        </div>
      ) : (
        <div id="district-kpi-strip-body" className="district-kpi-strip__cards">
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
        </div>
      )}
    </section>
  )
}

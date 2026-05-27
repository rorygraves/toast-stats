/**
 * Area recognition types.
 *
 * Per-area club aggregation used to derive district performance targets
 * (`AnalyticsComputer.computePerformanceTargets`). This is the only live
 * consumer — it sums `paidClubs` / `distinguishedClubs` across areas.
 *
 * The divergent area/division recognition-LEVEL surface (DAP/DDP percent-based
 * tiers, eligibility, threshold percentages) was removed in #799: it had no
 * live consumer, and it contradicted the verified recognition source of truth
 * (`divisionGapAnalysis.ts`, DDP manual item 1490). See
 * docs/investigations/799-recognition-consolidation-plan.md.
 */

/**
 * Per-area club counts.
 *
 * Distinguished clubs are counted against paid clubs only (a suspended club is
 * neither paid nor distinguished).
 */
export interface AreaRecognition {
  areaId: string
  areaName: string
  divisionId: string

  /** Total clubs assigned to the area */
  totalClubs: number
  /** Clubs in good standing (Active / paid) */
  paidClubs: number
  /** Paid clubs at any distinguished level (Distinguished, Select, Presidents, Smedley) */
  distinguishedClubs: number
}

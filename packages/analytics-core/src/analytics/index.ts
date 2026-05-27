/**
 * Analytics Module Exports
 *
 * This module exports all analytics computation components.
 *
 * Requirements: 7.2, 7.3, 7.4, 7.5
 */

// Main analytics computer
export { AnalyticsComputer } from './AnalyticsComputer.js'

// Individual analytics modules
export { MembershipAnalyticsModule } from './MembershipAnalyticsModule.js'
export { ClubHealthAnalyticsModule } from './ClubHealthAnalyticsModule.js'
export { DistinguishedClubAnalyticsModule } from './DistinguishedClubAnalyticsModule.js'
export { DivisionAreaAnalyticsModule } from './DivisionAreaAnalyticsModule.js'
export { LeadershipAnalyticsModule } from './LeadershipAnalyticsModule.js'
export { AreaDivisionRecognitionModule } from './AreaDivisionRecognitionModule.js'

// Club eligibility utilities (shared across modules)
export {
  calculateNetGrowth,
  determineDistinguishedLevel,
  getConfirmedDistinguishedLevel,
  getCSPStatus,
  isDistinguishedProvisional,
} from './ClubEligibilityUtils.js'

// Utility functions
export {
  parseIntSafe,
  parseIntOrUndefined,
  ensureString,
  getDCPCheckpoint,
  getCurrentProgramMonth,
  getMonthName,
  findPreviousProgramYearDate,
  calculatePercentageChange,
  determineTrend,
} from './AnalyticsUtils.js'

export type { MultiYearTrendDirection } from './AnalyticsUtils.js'

// Risk factors conversion utilities (Requirements 2.6)
export {
  riskFactorsToStringArray,
  stringArrayToRiskFactors,
  RISK_FACTOR_LABELS,
} from './riskFactors.js'

// Target calculation utilities (Requirements 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6)
export {
  calculateGrowthTargets,
  calculatePercentageTargets,
  determineAchievedLevel,
  GROWTH_PERCENTAGES,
  DISTINGUISHED_PERCENTAGES,
} from './TargetCalculator.js'

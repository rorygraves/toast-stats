/**
 * @toastmasters/analytics-core
 *
 * Shared analytics computation logic for Toastmasters statistics.
 * This package provides the core algorithms and types used by both
 * collector-cli (for pre-computing analytics) and backend (for validation).
 */

// Version and compatibility
export {
  ANALYTICS_SCHEMA_VERSION,
  COMPUTATION_VERSION,
  isCompatibleVersion,
} from './version.js'

// Data transformation
export { DataTransformer } from './transformation/index.js'
export type { Logger, DataTransformerConfig } from './transformation/index.js'

// Analytics computation
export {
  AnalyticsComputer,
  MembershipAnalyticsModule,
  ClubHealthAnalyticsModule,
  DistinguishedClubAnalyticsModule,
  DivisionAreaAnalyticsModule,
  LeadershipAnalyticsModule,
  AreaDivisionRecognitionModule,
  DAP_THRESHOLDS,
  DDP_THRESHOLDS,
  // Utility functions
  parseIntSafe,
  parseIntOrUndefined,
  ensureString,
  getDCPCheckpoint,
  getCurrentProgramMonth,
  getMonthName,
  findPreviousProgramYearDate,
  calculatePercentageChange,
  determineTrend,
  // Risk factors conversion utilities (Requirements 2.6)
  riskFactorsToStringArray,
  stringArrayToRiskFactors,
  RISK_FACTOR_LABELS,
  // Target calculation utilities (Requirements 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6)
  calculateGrowthTargets,
  calculatePercentageTargets,
  determineAchievedLevel,
  GROWTH_PERCENTAGES,
  DISTINGUISHED_PERCENTAGES,
  // Club eligibility utilities
  getConfirmedDistinguishedLevel,
  getCSPStatus,
  isDistinguishedProvisional,
} from './analytics/index.js'

export type { MultiYearTrendDirection } from './analytics/index.js'

// Goal Achievement Timeline primitive (#621)
export {
  goalsMetAtDate,
  TOTAL_DCP_GOALS,
  type GoalsMetResult,
} from './analytics/goalsMetAtDate.js'

// Type definitions
export type {
  // Metadata
  AnalyticsMetadata,

  // Membership trends
  MembershipTrendPoint,
  PaymentsTrendPoint,
  YearOverYearComparison,
  MembershipTrendData,

  // Club health
  ClubRiskFactors,
  ClubHealthStatus,
  DistinguishedLevel,
  DcpGoalsTrendPoint,
  ClubTrend,
  ClubHealthData,

  // Division and area
  DivisionRanking,
  AreaPerformance,
  TrendDirection,
  DivisionAnalytics,
  AreaAnalytics,
  DivisionHeatmapData,
  HeatmapCell,

  // Distinguished clubs
  DistinguishedProjection,
  DistinguishedClubSummary,
  DistinguishedClubCounts,

  // Distinguished Club Analytics types (Requirements 5.1, 5.2)
  DistinguishedClubAchievement,
  DCPGoalAnalysis,
  DistinguishedClubAnalytics,

  // Core analytics
  DateRange,
  DistrictAnalytics,
  AnalyticsComputationResult,
  ComputeOptions,

  // File structures
  PreComputedAnalyticsFile,
  AnalyticsManifestEntry,
  AnalyticsManifest,

  // Membership Analytics types (Requirements 1.2)
  SeasonalPattern,
  MembershipYearOverYearComparison,
  MembershipAnalytics,
  MembershipAnalyticsData,
  GrowthVelocity,

  // Leadership Insights types (Requirements 4.2)
  LeadershipEffectivenessScore,
  LeadershipChange,
  AreaDirectorCorrelation,
  LeadershipInsights,
  LeadershipInsightsData,

  // Extended Year-Over-Year Comparison types (Requirements 6.2, 6.3)
  ExtendedYearOverYearComparison,

  // Year-Over-Year Data types (Requirements 6.1, 6.2, 6.3)
  MetricComparison,
  MultiYearTrend,
  YearOverYearData,

  // Performance Targets Data types (Requirements 7.1, 7.2)
  PerformanceTargetsData,

  // District Performance Targets types (Requirements 7.2)
  RecognitionLevel,
  RecognitionTargets,
  MetricTargets,
  RegionRankData,
  MetricRankings,
  DistrictPerformanceTargets,

  // Vulnerable Clubs Data types (Requirements 3.2)
  VulnerableClubsData,

  // Club Trends Index types (Requirements 2.2)
  ClubTrendsIndex,

  // Area/Division Recognition types (Requirements 7.1)
  AreaDivisionRecognitionLevel,
  RecognitionEligibility,
  AreaRecognition,
  DivisionRecognition,

  // Distinguished Club Analytics Data types (Requirements 5.1, 5.2)
  DistinguishedClubAnalyticsData,

  // Extended Analytics Computation Result (Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1)
  ExtendedAnalyticsComputationResult,
} from './types.js'

// Interfaces
export type {
  // Raw data
  RawCSVData,

  // Statistics
  DistrictStatistics,
  ClubStatistics,
  DivisionStatistics,
  AreaStatistics,
  DistrictTotals,

  // Snapshots
  SnapshotMetadata,
  Snapshot,

  // Core interfaces
  IAnalyticsComputer,
  IDataTransformer,
} from './interfaces.js'

// Time-series computation
export {
  TimeSeriesDataPointBuilder,
  type DistrictStatisticsInput,
  type MembershipStats,
  type ScrapedRecord,
} from './timeseries/index.js'

// Rankings computation
export {
  BordaCountRankingCalculator,
  MetricRankingsCalculator,
  CompetitiveAwardsCalculator,
  type IRankingCalculator,
  type RankingLogger,
  type RankingDistrictStatistics,
  type DistrictRankingData,
  type BordaCountRankingCalculatorConfig,
  type MetricType,
  type RegionRankResult,
  type CompetitiveAwardRanking,
  type CompetitiveAwardsByDistrict,
  type CompetitiveAwardStandings,
  DistinguishedDistrictCalculator,
  type DistinguishedDistrictTier,
  type DistinguishedDistrictPrerequisites,
  type DistinguishedDistrictGap,
  type DistinguishedDistrictStatus,
  ClubStrengthAwardCalculator,
  type ClubStrengthInput,
  type ClubStrengthResult,
  type ClubStrengthAwardStandings,
  LeadershipExcellenceCalculator,
  type LeadershipExcellenceInput,
  type LeadershipExcellenceResult,
  type LeadershipExcellenceStandings,
  OfficerAwardsCalculator,
  type OfficerAwardResult,
  type OfficerAwardStandings,
  calculateDistinguishedPercent,
  calculateCategoryRanking,
  calculateAggregateRankings,
  type CategoryRanking,
  type AggregateRanking,
  type CategoryRankingLogger,
  parseDateFlexible,
  getProgramYearStartDate,
  parseCharterDateFromStatusField,
} from './rankings/index.js'

/**
 * Fast-check generators for division and area performance testing
 *
 * **Feature: division-area-performance-cards**
 *
 * This module provides reusable fast-check generators for property-based testing
 * of division and area performance components and utilities. These generators
 * create randomized test data that conforms to the domain model while ensuring
 * test isolation and consistency.
 *
 * Usage:
 * ```typescript
 * import * as fc from 'fast-check'
 * import { divisionPerformanceArb, areaPerformanceArb } from '@/test-utils/generators/divisionPerformance'
 *
 * fc.assert(
 *   fc.property(divisionPerformanceArb, (division) => {
 *     // Your property test here
 *   })
 * )
 * ```
 */

import * as fc from 'fast-check'
import type {
  DistinguishedStatus,
  DivisionPerformance,
  AreaPerformance,
  VisitStatus,
} from '../../utils/divisionStatus'
import { deriveAreaRecognitionState } from '../../utils/areaRecognitionState'

/**
 * Generator for division identifiers (A-Z, AA-ZZ)
 *
 * Generates realistic division identifiers that could appear in a Toastmasters district.
 * Single-letter divisions (A-Z) are more common, so they're weighted more heavily.
 *
 * @example
 * fc.sample(divisionIdArb, 5)
 * // => ['A', 'B', 'AA', 'C', 'AB']
 */
export const divisionIdArb = fc.oneof(
  // Single letter divisions (A-Z) - weighted more heavily
  fc.stringMatching(/^[A-Z]$/),
  fc.stringMatching(/^[A-Z]$/),
  // Double letter divisions (AA-ZZ)
  fc.stringMatching(/^[A-Z]{2}$/)
)

/**
 * Generator for area identifiers (A1-Z9, AA1-ZZ9)
 *
 * Generates realistic area identifiers that follow Toastmasters naming conventions.
 * Areas are typically numbered 1-9 within each division.
 *
 * @example
 * fc.sample(areaIdArb, 5)
 * // => ['A1', 'B2', 'AA3', 'C4', 'AB5']
 */
export const areaIdArb = fc.oneof(
  // Single letter + digit (A1-Z9)
  fc
    .tuple(fc.stringMatching(/^[A-Z]$/), fc.integer({ min: 1, max: 9 }))
    .map(([letter, num]) => `${letter}${num}`),
  // Double letter + digit (AA1-ZZ9)
  fc
    .tuple(fc.stringMatching(/^[A-Z]{2}$/), fc.integer({ min: 1, max: 9 }))
    .map(([letters, num]) => `${letters}${num}`)
)

/**
 * Generator for club counts (0-100)
 *
 * Generates realistic club counts for divisions and areas.
 * Most divisions have 10-50 clubs, but we allow the full range for edge case testing.
 *
 * @example
 * fc.sample(clubCountArb, 5)
 * // => [15, 42, 8, 67, 23]
 */
export const clubCountArb = fc.integer({ min: 0, max: 100 })

/**
 * Generator for net growth values (-50 to +50)
 *
 * Generates realistic net growth values (positive, negative, or zero).
 * Most divisions experience modest growth or decline, but we allow larger
 * values for edge case testing.
 *
 * @example
 * fc.sample(netGrowthArb, 5)
 * // => [2, -5, 0, 15, -3]
 */
export const netGrowthArb = fc.integer({ min: -50, max: 50 })

/**
 * Generator for division distinguished status (excludes 'not-qualified')
 *
 * Generates valid distinguished status values for divisions.
 * Note: 'not-qualified' is only valid for areas, not divisions.
 *
 * @example
 * fc.sample(divisionStatusArb, 4)
 * // => ['distinguished', 'not-distinguished', 'presidents-distinguished', 'select-distinguished']
 */
export const divisionStatusArb = fc.constantFrom<
  Exclude<DistinguishedStatus, 'not-qualified'>
>(
  'not-distinguished',
  'distinguished',
  'select-distinguished',
  'presidents-distinguished'
)

/**
 * Generator for area distinguished status (includes 'not-qualified')
 *
 * Generates valid distinguished status values for areas.
 * Areas can have 'not-qualified' status when they don't meet qualifying requirements.
 *
 * @example
 * fc.sample(areaStatusArb, 5)
 * // => ['not-qualified', 'distinguished', 'not-distinguished', 'presidents-distinguished', 'select-distinguished']
 */
export const areaStatusArb = fc.constantFrom<DistinguishedStatus>(
  'not-qualified',
  'not-distinguished',
  'distinguished',
  'select-distinguished',
  'presidents-distinguished'
)

/**
 * Generator for visit status objects
 *
 * Generates realistic visit status data including completed visits, required visits,
 * percentage, and threshold status. The generated data maintains internal consistency
 * (e.g., meetsThreshold is true when completed >= required).
 *
 * @param clubBase - Optional club base to calculate required visits from (75% of club base)
 *
 * @example
 * fc.sample(visitStatusArb(), 3)
 * // => [
 * //   { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 * //   { completed: 5, required: 8, percentage: 50, meetsThreshold: false },
 * //   { completed: 10, required: 8, percentage: 100, meetsThreshold: true }
 * // ]
 */
export const visitStatusArb = (
  clubBase?: number
): fc.Arbitrary<VisitStatus> => {
  if (clubBase !== undefined) {
    // Generate visit status based on a specific club base
    const required = Math.ceil(clubBase * 0.75)
    return fc.integer({ min: 0, max: clubBase }).map(completed => ({
      completed,
      required,
      percentage: (completed / clubBase) * 100,
      meetsThreshold: completed >= required,
    }))
  }

  // Generate arbitrary visit status with internal consistency
  return fc
    .tuple(
      fc.integer({ min: 1, max: 20 }), // club base
      fc.integer({ min: 0, max: 20 }) // completed visits
    )
    .map(([base, completed]) => {
      const actualCompleted = Math.min(completed, base)
      const required = Math.ceil(base * 0.75)
      return {
        completed: actualCompleted,
        required,
        percentage: (actualCompleted / base) * 100,
        meetsThreshold: actualCompleted >= required,
      }
    })
}

/**
 * Generator for area performance objects
 *
 * Generates complete area performance data with all required fields.
 * The generated data maintains internal consistency (e.g., net growth = paid clubs - club base).
 *
 * @param options - Optional configuration for the generator
 * @param options.divisionId - Specific division ID to use (otherwise random)
 * @param options.qualified - Force qualified status (true/false, otherwise random)
 *
 * @example
 * fc.sample(areaPerformanceArb(), 2)
 * // => [
 * //   {
 * //     areaId: 'A1',
 * //     status: 'distinguished',
 * //     clubBase: 10,
 * //     paidClubs: 10,
 * //     netGrowth: 0,
 * //     distinguishedClubs: 5,
 * //     requiredDistinguishedClubs: 5,
 * //     firstRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 * //     secondRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 * //     isQualified: true
 * //   },
 * //   ...
 * // ]
 */
export const areaPerformanceArb = (options?: {
  divisionId?: string
  qualified?: boolean
}): fc.Arbitrary<AreaPerformance> => {
  return fc
    .tuple(
      areaIdArb,
      clubCountArb, // clubBase
      clubCountArb, // paidClubs
      clubCountArb, // distinguishedClubs
      options?.qualified !== undefined
        ? fc.constant(options.qualified)
        : fc.boolean()
    )
    .chain(([areaId, clubBase, paidClubs, distinguishedClubs, isQualified]) => {
      const netGrowth = paidClubs - clubBase
      const requiredDistinguishedClubs = Math.ceil(clubBase * 0.5)

      // Generate visit status based on club base
      return fc
        .tuple(visitStatusArb(clubBase), visitStatusArb(clubBase))
        .map(([firstRoundVisits, secondRoundVisits]) => {
          // Calculate status based on qualifying and metrics
          let status: DistinguishedStatus

          if (!isQualified) {
            status = 'not-qualified'
          } else if (
            distinguishedClubs >= requiredDistinguishedClubs + 1 &&
            netGrowth >= 1
          ) {
            status = 'presidents-distinguished'
          } else if (
            distinguishedClubs >= requiredDistinguishedClubs + 1 &&
            paidClubs >= clubBase
          ) {
            status = 'select-distinguished'
          } else if (
            distinguishedClubs >= requiredDistinguishedClubs &&
            paidClubs >= clubBase
          ) {
            status = 'distinguished'
          } else {
            status = 'not-distinguished'
          }

          return {
            areaId,
            status,
            clubBase,
            paidClubs,
            netGrowth,
            distinguishedClubs,
            requiredDistinguishedClubs,
            firstRoundVisits,
            secondRoundVisits,
            isQualified,
            recognitionState: deriveAreaRecognitionState({
              clubBase,
              paidClubs,
              distinguishedClubs,
              firstRoundVisitMet: firstRoundVisits.meetsThreshold,
              secondRoundVisitMet: secondRoundVisits.meetsThreshold,
              // Mid-year snapshot so the generator yields a stable mix of
              // confirmed/provisional/not-distinguished states.
              snapshotDate: '2026-03-15',
            }),
            // #973: the area arb models aggregate visit status, not per-club
            // rows, so there are no enumerable missing clubs. snapshotDate
            // '2026-03-15' (March) ⇒ round 2.
            currentRound: 2 as const,
            clubsMissingCurrentRoundVisit: [],
            clubsMissingCurrentRoundVisitIneligible: [],
          }
        })
    })
}

/**
 * Generator for division performance objects
 *
 * Generates complete division performance data with all required fields.
 * The generated data maintains internal consistency and includes an array of areas.
 *
 * @param options - Optional configuration for the generator
 * @param options.areaCount - Specific number of areas to generate (otherwise 0-8)
 * @param options.includeAreas - Whether to include areas (default: true)
 *
 * @example
 * fc.sample(divisionPerformanceArb(), 1)
 * // => [
 * //   {
 * //     divisionId: 'A',
 * //     status: 'select-distinguished',
 * //     clubBase: 40,
 * //     paidClubs: 42,
 * //     netGrowth: 2,
 * //     distinguishedClubs: 22,
 * //     requiredDistinguishedClubs: 20,
 * //     areas: [
 * //       { areaId: 'A1', status: 'distinguished', ... },
 * //       { areaId: 'A2', status: 'not-qualified', ... },
 * //       ...
 * //     ]
 * //   }
 * // ]
 */
export const divisionPerformanceArb = (options?: {
  areaCount?: number
  includeAreas?: boolean
}): fc.Arbitrary<DivisionPerformance> => {
  const includeAreas = options?.includeAreas ?? true

  return fc
    .tuple(
      divisionIdArb,
      clubCountArb, // clubBase
      clubCountArb, // paidClubs
      clubCountArb // distinguishedClubs
    )
    .chain(([divisionId, clubBase, paidClubs, distinguishedClubs]) => {
      const netGrowth = paidClubs - clubBase
      const requiredDistinguishedClubs = Math.ceil(clubBase * 0.5)

      // Calculate division status
      let status: Exclude<DistinguishedStatus, 'not-qualified'>

      if (
        distinguishedClubs >= requiredDistinguishedClubs + 1 &&
        netGrowth >= 1
      ) {
        status = 'presidents-distinguished'
      } else if (
        distinguishedClubs >= requiredDistinguishedClubs + 1 &&
        paidClubs >= clubBase
      ) {
        status = 'select-distinguished'
      } else if (
        distinguishedClubs >= requiredDistinguishedClubs &&
        paidClubs >= clubBase
      ) {
        status = 'distinguished'
      } else {
        status = 'not-distinguished'
      }

      // Generate areas
      const areasArb = includeAreas
        ? fc
            .array(areaPerformanceArb(), {
              minLength: options?.areaCount ?? 0,
              maxLength: options?.areaCount ?? 8,
            })
            .map(areas => {
              // Ensure unique area IDs and sort by ID
              const uniqueAreas = Array.from(
                new Map(areas.map(a => [a.areaId, a])).values()
              )
              return uniqueAreas.sort((a, b) =>
                a.areaId.localeCompare(b.areaId)
              )
            })
        : fc.constant([] as AreaPerformance[])

      return areasArb.map(areas => ({
        divisionId,
        status,
        clubBase,
        paidClubs,
        netGrowth,
        distinguishedClubs,
        requiredDistinguishedClubs,
        areas,
      }))
    })
}

/**
 * Generator for arrays of division performance objects
 *
 * Generates an array of divisions with unique identifiers, sorted by division ID.
 * Useful for testing components that display multiple divisions.
 *
 * @param options - Optional configuration for the generator
 * @param options.minLength - Minimum number of divisions (default: 0)
 * @param options.maxLength - Maximum number of divisions (default: 10)
 * @param options.includeAreas - Whether divisions should include areas (default: true)
 *
 * @example
 * fc.sample(divisionsArrayArb({ minLength: 2, maxLength: 3 }), 1)
 * // => [
 * //   [
 * //     { divisionId: 'A', status: 'distinguished', areas: [...], ... },
 * //     { divisionId: 'B', status: 'not-distinguished', areas: [...], ... }
 * //   ]
 * // ]
 */
export const divisionsArrayArb = (options?: {
  minLength?: number
  maxLength?: number
  includeAreas?: boolean
}): fc.Arbitrary<DivisionPerformance[]> => {
  const includeAreas = options?.includeAreas ?? true

  return fc
    .array(divisionPerformanceArb({ includeAreas }), {
      minLength: options?.minLength ?? 0,
      maxLength: options?.maxLength ?? 10,
    })
    .map(divisions => {
      // Ensure unique division IDs and sort by ID
      const uniqueDivisions = Array.from(
        new Map(divisions.map(d => [d.divisionId, d])).values()
      )
      return uniqueDivisions.sort((a, b) =>
        a.divisionId.localeCompare(b.divisionId)
      )
    })
}

/**
 * Generator for mock district snapshot objects
 *
 * Generates minimal district snapshot structures that can be passed to components.
 * The actual structure doesn't matter much since extraction functions are typically mocked,
 * but this provides a realistic shape for integration tests.
 *
 * @example
 * fc.sample(districtSnapshotArb, 1)
 * // => [
 * //   {
 * //     divisionPerformance: [{...}, {...}],
 * //     clubPerformance: [{...}, {...}]
 * //   }
 * // ]
 */
export const districtSnapshotArb = fc.record({
  divisionPerformance: fc.array(fc.record({}), { maxLength: 10 }),
  clubPerformance: fc.array(fc.record({}), { maxLength: 100 }),
})

/**
 * Generator for ISO 8601 timestamp strings
 *
 * Generates realistic timestamp strings in ISO 8601 format.
 * Useful for testing snapshot timestamp display.
 *
 * @param options - Optional configuration for the generator
 * @param options.min - Minimum date (default: 2020-01-01)
 * @param options.max - Maximum date (default: 2030-12-31)
 *
 * @example
 * fc.sample(timestampArb(), 3)
 * // => [
 * //   '2023-05-15T14:30:00.000Z',
 * //   '2025-11-22T08:15:30.000Z',
 * //   '2021-03-10T19:45:00.000Z'
 * // ]
 */
export const timestampArb = (options?: {
  min?: Date
  max?: Date
}): fc.Arbitrary<string> => {
  return fc
    .date({
      min: options?.min ?? new Date('2020-01-01'),
      max: options?.max ?? new Date('2030-12-31'),
    })
    .filter(date => !isNaN(date.getTime()))
    .map(date => date.toISOString())
}

/**
 * Generator for club base values (positive integers)
 *
 * Generates realistic club base values for divisions and areas.
 * Useful for testing threshold calculations and status logic.
 *
 * @param options - Optional configuration for the generator
 * @param options.min - Minimum club base (default: 1)
 * @param options.max - Maximum club base (default: 100)
 *
 * @example
 * fc.sample(clubBaseArb(), 5)
 * // => [15, 42, 8, 67, 23]
 */
export const clubBaseArb = (options?: {
  min?: number
  max?: number
}): fc.Arbitrary<number> => {
  return fc.integer({
    min: options?.min ?? 1,
    max: options?.max ?? 100,
  })
}

/**
 * Generator for area qualifying metrics
 *
 * Generates complete sets of metrics needed to determine area qualifying status.
 * Useful for testing the qualifying gate logic.
 *
 * @example
 * fc.sample(areaQualifyingMetricsArb, 2)
 * // => [
 * //   {
 * //     netGrowth: 2,
 * //     firstRoundVisits: { completed: 8, required: 8, percentage: 80, meetsThreshold: true },
 * //     secondRoundVisits: { completed: 7, required: 8, percentage: 70, meetsThreshold: false }
 * //   },
 * //   ...
 * // ]
 */
export const areaQualifyingMetricsArb = fc.record({
  netGrowth: netGrowthArb,
  firstRoundVisits: visitStatusArb(),
  secondRoundVisits: visitStatusArb(),
})

/**
 * Generator for division metrics (for status calculation testing)
 *
 * Generates complete sets of metrics needed to calculate division status.
 * The generated data maintains internal consistency.
 *
 * @example
 * fc.sample(divisionMetricsArb, 2)
 * // => [
 * //   {
 * //     clubBase: 20,
 * //     threshold: 10,
 * //     distinguishedClubs: 12,
 * //     paidClubs: 22
 * //   },
 * //   ...
 * // ]
 */
export const divisionMetricsArb = clubBaseArb().chain(clubBase => {
  const threshold = Math.ceil(clubBase * 0.5)
  return fc.record({
    clubBase: fc.constant(clubBase),
    threshold: fc.constant(threshold),
    distinguishedClubs: fc.integer({ min: 0, max: clubBase }),
    paidClubs: fc.integer({ min: 0, max: clubBase + 50 }), // Allow growth beyond base
  })
})

/**
 * Generator for area metrics (for status calculation testing)
 *
 * Generates complete sets of metrics needed to calculate area status.
 * The generated data maintains internal consistency.
 *
 * @example
 * fc.sample(areaMetricsArb, 2)
 * // => [
 * //   {
 * //     clubBase: 10,
 * //     threshold: 5,
 * //     distinguishedClubs: 6,
 * //     paidClubs: 11,
 * //     isQualified: true
 * //   },
 * //   ...
 * // ]
 */
export const areaMetricsArb = clubBaseArb().chain(clubBase => {
  const threshold = Math.ceil(clubBase * 0.5)
  return fc.record({
    clubBase: fc.constant(clubBase),
    threshold: fc.constant(threshold),
    distinguishedClubs: fc.integer({ min: 0, max: clubBase }),
    paidClubs: fc.integer({ min: 0, max: clubBase + 50 }), // Allow growth beyond base
    isQualified: fc.boolean(),
  })
})

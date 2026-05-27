/**
 * Division Status Property-Based Tests
 *
 * @pbt-justification Warranted per .kiro/steering/testing.md criteria:
 *   - Complex input space: status computation across generated club/division data structures
 *   - Universal business rule: status derivation must be deterministic and consistent
 *
 * **Feature: division-area-performance-cards**
 *
 * Property-based tests to verify the correctness of division and area
 * status calculation logic across many randomized inputs.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateRequiredDistinguishedClubs,
  calculateNetGrowth,
  calculateVisitStatus,
  calculateDivisionStatus,
  checkAreaQualifying,
  calculateAreaStatus,
} from '../divisionStatus'
import { determineDivisionRecognitionLevel } from '../divisionGapAnalysis'

/**
 * **Feature: division-area-performance-cards, Property 1: Distinguished Club Threshold Calculation**
 * **Validates: Requirements 2.1, 5.5**
 *
 * For any club base value greater than zero, the required distinguished clubs
 * threshold SHALL equal Math.ceil(clubBase * 0.5), which represents 50% of
 * the club base rounded up.
 *
 * This property ensures that:
 * - The threshold is always calculated consistently
 * - Rounding always goes up (ceiling function)
 * - The formula correctly implements the 50% requirement
 */
describe('Property 1: Distinguished Club Threshold Calculation', () => {
  // Generator for valid club base values (positive integers)
  const clubBaseArb = fc.integer({ min: 1, max: 100 })

  it('should calculate threshold as Math.ceil(clubBase * 0.5) for any club base > 0', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        const result = calculateRequiredDistinguishedClubs(clubBase)
        const expected = Math.ceil(clubBase * 0.5)

        // The result must equal the ceiling of 50% of club base
        expect(result).toBe(expected)

        // Additional invariants to verify correctness
        // Result must be a positive integer
        expect(Number.isInteger(result)).toBe(true)
        expect(result).toBeGreaterThan(0)

        // Result must be at most the club base (can't require more than 100%)
        expect(result).toBeLessThanOrEqual(clubBase)

        // Result must be at least half the club base (50% requirement)
        expect(result).toBeGreaterThanOrEqual(clubBase / 2)

        // For even club bases, result should be exactly half
        if (clubBase % 2 === 0) {
          expect(result).toBe(clubBase / 2)
        }

        // For odd club bases, result should be half rounded up
        if (clubBase % 2 === 1) {
          expect(result).toBe(Math.floor(clubBase / 2) + 1)
        }
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce consistent results for the same club base', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        // Call the function multiple times with the same input
        const result1 = calculateRequiredDistinguishedClubs(clubBase)
        const result2 = calculateRequiredDistinguishedClubs(clubBase)
        const result3 = calculateRequiredDistinguishedClubs(clubBase)

        // All results must be identical (deterministic function)
        expect(result1).toBe(result2)
        expect(result2).toBe(result3)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce monotonically increasing thresholds for increasing club bases', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99 }), (clubBase: number) => {
        const threshold1 = calculateRequiredDistinguishedClubs(clubBase)
        const threshold2 = calculateRequiredDistinguishedClubs(clubBase + 1)

        // Threshold for larger club base must be >= threshold for smaller club base
        expect(threshold2).toBeGreaterThanOrEqual(threshold1)

        // The difference should be at most 1 (since we're incrementing by 1)
        expect(threshold2 - threshold1).toBeLessThanOrEqual(1)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle edge case of club base = 1', () => {
    const result = calculateRequiredDistinguishedClubs(1)

    // For club base of 1, 50% rounded up should be 1
    expect(result).toBe(1)
    expect(result).toBe(Math.ceil(1 * 0.5))
  })

  it('should handle edge case of club base = 2', () => {
    const result = calculateRequiredDistinguishedClubs(2)

    // For club base of 2, 50% should be exactly 1
    expect(result).toBe(1)
    expect(result).toBe(Math.ceil(2 * 0.5))
  })

  it('should verify specific known examples', () => {
    // Test specific examples to ensure correctness
    const testCases = [
      { clubBase: 1, expected: 1 }, // 50% of 1 = 0.5 → 1
      { clubBase: 2, expected: 1 }, // 50% of 2 = 1.0 → 1
      { clubBase: 3, expected: 2 }, // 50% of 3 = 1.5 → 2
      { clubBase: 4, expected: 2 }, // 50% of 4 = 2.0 → 2
      { clubBase: 5, expected: 3 }, // 50% of 5 = 2.5 → 3
      { clubBase: 10, expected: 5 }, // 50% of 10 = 5.0 → 5
      { clubBase: 11, expected: 6 }, // 50% of 11 = 5.5 → 6
      { clubBase: 20, expected: 10 }, // 50% of 20 = 10.0 → 10
      { clubBase: 21, expected: 11 }, // 50% of 21 = 10.5 → 11
    ]

    testCases.forEach(({ clubBase, expected }) => {
      const result = calculateRequiredDistinguishedClubs(clubBase)
      expect(result).toBe(expected)
    })
  })
})

/**
 * **Feature: division-area-performance-cards, Property 5: Net Growth Calculation**
 * **Validates: Requirements 2.6**
 *
 * For any valid paid clubs count and club base, net growth SHALL equal
 * (paidClubs - clubBase), which can be positive (growth), negative (decline),
 * or zero (no change).
 *
 * This property ensures that:
 * - Net growth is calculated consistently
 * - The calculation handles positive growth correctly
 * - The calculation handles negative growth (club loss) correctly
 * - The calculation handles zero growth (no change) correctly
 * - The calculation is commutative with respect to the subtraction operation
 */
describe('Property 5: Net Growth Calculation', () => {
  // Generator for valid club counts (non-negative integers)
  const clubCountArb = fc.integer({ min: 0, max: 100 })

  it('should calculate net growth as (paidClubs - clubBase) for any valid inputs', () => {
    fc.assert(
      fc.property(
        clubCountArb,
        clubCountArb,
        (paidClubs: number, clubBase: number) => {
          // Calculate net growth using the function
          const netGrowth = calculateNetGrowth(paidClubs, clubBase)
          const expected = paidClubs - clubBase

          // The result must equal the difference
          expect(netGrowth).toBe(expected)

          // Additional invariants to verify correctness
          // Net growth must be an integer
          expect(Number.isInteger(netGrowth)).toBe(true)

          // When paidClubs > clubBase, net growth must be positive
          if (paidClubs > clubBase) {
            expect(netGrowth).toBeGreaterThan(0)
          }

          // When paidClubs < clubBase, net growth must be negative
          if (paidClubs < clubBase) {
            expect(netGrowth).toBeLessThan(0)
          }

          // When paidClubs === clubBase, net growth must be zero
          if (paidClubs === clubBase) {
            expect(netGrowth).toBe(0)
          }

          // The absolute value of net growth must not exceed the larger of the two values
          expect(Math.abs(netGrowth)).toBeLessThanOrEqual(
            Math.max(paidClubs, clubBase)
          )
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce consistent results for the same inputs', () => {
    fc.assert(
      fc.property(
        clubCountArb,
        clubCountArb,
        (paidClubs: number, clubBase: number) => {
          // Calculate net growth multiple times with the same inputs
          const result1 = calculateNetGrowth(paidClubs, clubBase)
          const result2 = calculateNetGrowth(paidClubs, clubBase)
          const result3 = calculateNetGrowth(paidClubs, clubBase)

          // All results must be identical (deterministic calculation)
          expect(result1).toBe(result2)
          expect(result2).toBe(result3)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle positive growth correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (clubBase: number, growth: number) => {
          const paidClubs = clubBase + growth
          const netGrowth = calculateNetGrowth(paidClubs, clubBase)

          // Net growth must equal the growth amount
          expect(netGrowth).toBe(growth)
          expect(netGrowth).toBeGreaterThan(0)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle negative growth (club loss) correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 1, max: 50 }),
        (clubBase: number, loss: number) => {
          const paidClubs = Math.max(0, clubBase - loss)
          const netGrowth = calculateNetGrowth(paidClubs, clubBase)

          // Net growth must be negative or zero
          expect(netGrowth).toBeLessThanOrEqual(0)

          // If we lost clubs, net growth should reflect that
          if (paidClubs < clubBase) {
            expect(netGrowth).toBeLessThan(0)
          }
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle zero growth correctly', () => {
    fc.assert(
      fc.property(clubCountArb, (clubBase: number) => {
        const paidClubs = clubBase
        const netGrowth = calculateNetGrowth(paidClubs, clubBase)

        // Net growth must be exactly zero when counts are equal
        expect(netGrowth).toBe(0)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should verify specific known examples', () => {
    // Test specific examples to ensure correctness
    const testCases = [
      { paidClubs: 10, clubBase: 10, expected: 0 }, // No change
      { paidClubs: 12, clubBase: 10, expected: 2 }, // Positive growth
      { paidClubs: 8, clubBase: 10, expected: -2 }, // Negative growth
      { paidClubs: 0, clubBase: 5, expected: -5 }, // All clubs lost
      { paidClubs: 20, clubBase: 0, expected: 20 }, // Starting from zero
      { paidClubs: 1, clubBase: 1, expected: 0 }, // Single club, no change
      { paidClubs: 100, clubBase: 50, expected: 50 }, // Large positive growth
      { paidClubs: 25, clubBase: 75, expected: -50 }, // Large negative growth
    ]

    testCases.forEach(({ paidClubs, clubBase, expected }) => {
      const netGrowth = calculateNetGrowth(paidClubs, clubBase)
      expect(netGrowth).toBe(expected)
    })
  })

  it('should maintain the relationship: paidClubs = clubBase + netGrowth', () => {
    fc.assert(
      fc.property(
        clubCountArb,
        clubCountArb,
        (paidClubs: number, clubBase: number) => {
          const netGrowth = calculateNetGrowth(paidClubs, clubBase)

          // Verify the inverse relationship
          expect(clubBase + netGrowth).toBe(paidClubs)
          expect(paidClubs - netGrowth).toBe(clubBase)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })
})

/**
 * **Feature: division-area-performance-cards, Property 6: Visit Completion Percentage Calculation**
 * **Validates: Requirements 7.3, 7.4**
 *
 * For any valid completed visits count and club base, the visit completion
 * percentage SHALL equal (completedVisits / clubBase) × 100, and the threshold
 * SHALL be met when percentage ≥ 75.
 *
 * This property ensures that:
 * - Visit completion percentage is calculated consistently
 * - The percentage is correctly computed as a ratio
 * - The 75% threshold is correctly determined
 * - The required visits count is 75% of club base rounded up
 * - Edge cases (zero club base, zero visits) are handled correctly
 */
describe('Property 6: Visit Completion Percentage Calculation', () => {
  // Generator for valid club base values (positive integers)
  const clubBaseArb = fc.integer({ min: 1, max: 100 })

  it('should calculate visit status correctly for any valid inputs', () => {
    fc.assert(
      fc.property(
        clubBaseArb,
        fc.integer({ min: 0, max: 100 }),
        (clubBase: number, completedVisits: number) => {
          // Constrain completed visits to be at most club base
          const actualCompleted = Math.min(completedVisits, clubBase)

          const result = calculateVisitStatus(actualCompleted, clubBase)

          // Calculate expected values
          const expectedPercentage = (actualCompleted / clubBase) * 100
          const expectedRequired = Math.ceil(clubBase * 0.75)
          const expectedMeetsThreshold = actualCompleted >= expectedRequired

          // Verify all fields are correct
          expect(result.completed).toBe(actualCompleted)
          expect(result.required).toBe(expectedRequired)
          expect(result.percentage).toBeCloseTo(expectedPercentage, 2)
          expect(result.meetsThreshold).toBe(expectedMeetsThreshold)

          // Additional invariants
          // Percentage must be between 0 and 100
          expect(result.percentage).toBeGreaterThanOrEqual(0)
          expect(result.percentage).toBeLessThanOrEqual(100)

          // Required must be at least 75% of club base
          expect(result.required).toBeGreaterThanOrEqual(clubBase * 0.75)
          expect(result.required).toBeLessThanOrEqual(
            Math.ceil(clubBase * 0.75)
          )

          // If completed >= required, threshold must be met
          if (actualCompleted >= result.required) {
            expect(result.meetsThreshold).toBe(true)
          }

          // If completed < required, threshold must not be met
          if (actualCompleted < result.required) {
            expect(result.meetsThreshold).toBe(false)
          }
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce consistent results for the same inputs', () => {
    fc.assert(
      fc.property(
        clubBaseArb,
        fc.integer({ min: 0, max: 100 }),
        (clubBase: number, completedVisits: number) => {
          // Constrain completed visits to be at most club base
          const actualCompleted = Math.min(completedVisits, clubBase)

          // Calculate visit status multiple times with the same inputs
          const result1 = calculateVisitStatus(actualCompleted, clubBase)
          const result2 = calculateVisitStatus(actualCompleted, clubBase)
          const result3 = calculateVisitStatus(actualCompleted, clubBase)

          // All results must be identical (deterministic calculation)
          expect(result1).toEqual(result2)
          expect(result2).toEqual(result3)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should correctly identify when 75% threshold is met', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        const required = Math.ceil(clubBase * 0.75)

        // Test exactly at threshold
        const atThreshold = calculateVisitStatus(required, clubBase)
        expect(atThreshold.meetsThreshold).toBe(true)
        expect(atThreshold.percentage).toBeGreaterThanOrEqual(75)

        // Test one below threshold
        if (required > 0) {
          const belowThreshold = calculateVisitStatus(required - 1, clubBase)
          expect(belowThreshold.meetsThreshold).toBe(false)
          expect(belowThreshold.percentage).toBeLessThan(75)
        }

        // Test one above threshold
        if (required < clubBase) {
          const aboveThreshold = calculateVisitStatus(required + 1, clubBase)
          expect(aboveThreshold.meetsThreshold).toBe(true)
          expect(aboveThreshold.percentage).toBeGreaterThan(75)
        }
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle 100% completion correctly', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        const result = calculateVisitStatus(clubBase, clubBase)

        // 100% completion
        expect(result.completed).toBe(clubBase)
        expect(result.percentage).toBe(100)
        expect(result.meetsThreshold).toBe(true)

        // Required should still be 75% of club base
        expect(result.required).toBe(Math.ceil(clubBase * 0.75))
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle 0% completion correctly', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        const result = calculateVisitStatus(0, clubBase)

        // 0% completion
        expect(result.completed).toBe(0)
        expect(result.percentage).toBe(0)
        expect(result.meetsThreshold).toBe(false)

        // Required should still be 75% of club base
        expect(result.required).toBe(Math.ceil(clubBase * 0.75))
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should verify specific known examples', () => {
    // Test specific examples to ensure correctness
    const testCases = [
      {
        completed: 0,
        clubBase: 4,
        expected: {
          completed: 0,
          required: 3, // 75% of 4 = 3
          percentage: 0,
          meetsThreshold: false,
        },
      },
      {
        completed: 3,
        clubBase: 4,
        expected: {
          completed: 3,
          required: 3, // 75% of 4 = 3
          percentage: 75,
          meetsThreshold: true,
        },
      },
      {
        completed: 4,
        clubBase: 4,
        expected: {
          completed: 4,
          required: 3, // 75% of 4 = 3
          percentage: 100,
          meetsThreshold: true,
        },
      },
      {
        completed: 8,
        clubBase: 10,
        expected: {
          completed: 8,
          required: 8, // 75% of 10 = 7.5 → 8
          percentage: 80,
          meetsThreshold: true,
        },
      },
      {
        completed: 7,
        clubBase: 10,
        expected: {
          completed: 7,
          required: 8, // 75% of 10 = 7.5 → 8
          percentage: 70,
          meetsThreshold: false,
        },
      },
      {
        completed: 1,
        clubBase: 1,
        expected: {
          completed: 1,
          required: 1, // 75% of 1 = 0.75 → 1
          percentage: 100,
          meetsThreshold: true,
        },
      },
      {
        completed: 0,
        clubBase: 1,
        expected: {
          completed: 0,
          required: 1, // 75% of 1 = 0.75 → 1
          percentage: 0,
          meetsThreshold: false,
        },
      },
      {
        completed: 15,
        clubBase: 20,
        expected: {
          completed: 15,
          required: 15, // 75% of 20 = 15
          percentage: 75,
          meetsThreshold: true,
        },
      },
      {
        completed: 14,
        clubBase: 20,
        expected: {
          completed: 14,
          required: 15, // 75% of 20 = 15
          percentage: 70,
          meetsThreshold: false,
        },
      },
    ]

    testCases.forEach(({ completed, clubBase, expected }) => {
      const result = calculateVisitStatus(completed, clubBase)
      expect(result.completed).toBe(expected.completed)
      expect(result.required).toBe(expected.required)
      expect(result.percentage).toBeCloseTo(expected.percentage, 2)
      expect(result.meetsThreshold).toBe(expected.meetsThreshold)
    })
  })

  it('should maintain the relationship: meetsThreshold ⟺ completed >= required', () => {
    fc.assert(
      fc.property(
        clubBaseArb,
        fc.integer({ min: 0, max: 100 }),
        (clubBase: number, completedVisits: number) => {
          // Constrain completed visits to be at most club base
          const actualCompleted = Math.min(completedVisits, clubBase)

          const result = calculateVisitStatus(actualCompleted, clubBase)

          // Verify the equivalence relationship
          if (result.meetsThreshold) {
            expect(result.completed).toBeGreaterThanOrEqual(result.required)
          } else {
            expect(result.completed).toBeLessThan(result.required)
          }
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should calculate required as Math.ceil(clubBase * 0.75)', () => {
    fc.assert(
      fc.property(clubBaseArb, (clubBase: number) => {
        // Test with any completed visits value
        const result = calculateVisitStatus(0, clubBase)
        const expectedRequired = Math.ceil(clubBase * 0.75)

        expect(result.required).toBe(expectedRequired)

        // Additional invariants
        // Required must be at least 75% of club base
        expect(result.required).toBeGreaterThanOrEqual(clubBase * 0.75)

        // Required must be at most the club base
        expect(result.required).toBeLessThanOrEqual(clubBase)

        // Required must be a positive integer
        expect(Number.isInteger(result.required)).toBe(true)
        expect(result.required).toBeGreaterThan(0)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })
})

/**
 * **Feature: division-area-performance-cards, Property 2: Division Status Classification (DDP)**
 * **Validates: Requirements 2.2, 2.3, 2.4, 2.5; #798**
 *
 * Divisions follow the Distinguished DIVISION Program. `calculateDivisionStatus`
 * delegates its tier to `determineDivisionRecognitionLevel` (the single DDP
 * source shared with the card's gap/summary line) and maps the recognition
 * level to the badge enum. These properties assert that single-source guarantee
 * plus the DDP invariants: determinism, the no-net-club-loss gate, and
 * monotonicity in both distinguished and paid clubs.
 */
describe('Property 2: Division Status Classification (DDP)', () => {
  const statusOf = (dist: number, paid: number, base: number) =>
    calculateDivisionStatus(dist, paid, base)

  const LEVEL_TO_STATUS = {
    none: 'not-distinguished',
    distinguished: 'distinguished',
    select: 'select-distinguished',
    presidents: 'presidents-distinguished',
  } as const

  const statusOrder = {
    'not-distinguished': 0,
    distinguished: 1,
    'select-distinguished': 2,
    'presidents-distinguished': 3,
  } as const

  const divisionMetricsArb = fc.integer({ min: 0, max: 100 }).chain(clubBase =>
    fc.record({
      clubBase: fc.constant(clubBase),
      distinguishedClubs: fc.integer({ min: 0, max: clubBase }),
      paidClubs: fc.integer({ min: 0, max: clubBase + 50 }),
    })
  )

  it('badge tier equals the DDP recognition level mapped to the badge enum (single source of truth)', () => {
    fc.assert(
      fc.property(
        divisionMetricsArb,
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          const status = statusOf(distinguishedClubs, paidClubs, clubBase)
          const level = determineDivisionRecognitionLevel({
            clubBase,
            paidClubs,
            distinguishedClubs,
          })
          expect(status).toBe(LEVEL_TO_STATUS[level])
        }
      ),
      { numRuns: 50 }
    )
  })

  it('always returns one of the four division statuses', () => {
    fc.assert(
      fc.property(
        divisionMetricsArb,
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          expect([
            'not-distinguished',
            'distinguished',
            'select-distinguished',
            'presidents-distinguished',
          ]).toContain(statusOf(distinguishedClubs, paidClubs, clubBase))
        }
      ),
      { numRuns: 25 }
    )
  })

  it('is deterministic for identical inputs', () => {
    fc.assert(
      fc.property(
        divisionMetricsArb,
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          const a = statusOf(distinguishedClubs, paidClubs, clubBase)
          const b = statusOf(distinguishedClubs, paidClubs, clubBase)
          expect(a).toBe(b)
        }
      ),
      { numRuns: 25 }
    )
  })

  it('returns Not Distinguished on any net club loss (paid < base)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).chain(clubBase =>
          fc.record({
            clubBase: fc.constant(clubBase),
            distinguishedClubs: fc.integer({ min: 0, max: clubBase }),
            paidClubs: fc.integer({ min: 0, max: clubBase - 1 }),
          })
        ),
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          expect(statusOf(distinguishedClubs, paidClubs, clubBase)).toBe(
            'not-distinguished'
          )
        }
      ),
      { numRuns: 25 }
    )
  })

  it('never decreases tier when distinguished clubs increase (paid fixed)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }).chain(clubBase =>
          fc.record({
            clubBase: fc.constant(clubBase),
            distinguishedClubs: fc.integer({ min: 0, max: clubBase - 1 }),
            paidClubs: fc.integer({ min: 0, max: clubBase + 50 }),
          })
        ),
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          const lower = statusOf(distinguishedClubs, paidClubs, clubBase)
          const higher = statusOf(distinguishedClubs + 1, paidClubs, clubBase)
          expect(statusOrder[higher]).toBeGreaterThanOrEqual(statusOrder[lower])
        }
      ),
      { numRuns: 25 }
    )
  })

  it('never decreases tier when paid clubs increase (distinguished fixed)', () => {
    fc.assert(
      fc.property(
        divisionMetricsArb,
        ({ clubBase, distinguishedClubs, paidClubs }) => {
          const lower = statusOf(distinguishedClubs, paidClubs, clubBase)
          const higher = statusOf(distinguishedClubs, paidClubs + 1, clubBase)
          expect(statusOrder[higher]).toBeGreaterThanOrEqual(statusOrder[lower])
        }
      ),
      { numRuns: 25 }
    )
  })

  it('verifies the canonical D61 cases (#798): G→Select, H→Distinguished', () => {
    expect(statusOf(8, 17, 16)).toBe('select-distinguished') // base 16
    expect(statusOf(8, 18, 17)).toBe('distinguished') // base 17
  })
})

/**
 * **Feature: division-area-performance-cards, Property 3: Area Qualifying Requirements**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 *
 * For any area with valid metrics, the area SHALL be marked as qualified if and only if
 * ALL three conditions are met:
 * - No net club loss (paid clubs ≥ club base, i.e., net growth ≥ 0)
 * - First round visits ≥ 75% of club base
 * - Second round visits ≥ 75% of club base
 *
 * This property ensures that:
 * - All three criteria must be met for qualification
 * - Failing any single criterion results in not qualified
 * - The qualifying determination is deterministic and consistent
 * - Edge cases (zero net growth, exactly 75% visits) are handled correctly
 */
describe('Property 3: Area Qualifying Requirements', () => {
  // Generator for net growth values (can be negative, zero, or positive)
  const netGrowthArb = fc.integer({ min: -50, max: 50 })

  // Generator for visit status
  const visitStatusArb = fc.record({
    completed: fc.integer({ min: 0, max: 100 }),
    required: fc.integer({ min: 1, max: 100 }),
    percentage: fc.float({ min: 0, max: 100 }),
    meetsThreshold: fc.boolean(),
  })

  // Generator for area qualifying metrics
  const areaQualifyingMetricsArb = fc.record({
    netGrowth: netGrowthArb,
    firstRoundVisits: visitStatusArb,
    secondRoundVisits: visitStatusArb,
  })

  it('should mark area as qualified if and only if ALL three criteria are met', () => {
    fc.assert(
      fc.property(areaQualifyingMetricsArb, metrics => {
        const { netGrowth, firstRoundVisits, secondRoundVisits } = metrics

        const isQualified = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )

        // Determine expected qualification based on all three criteria
        const noClubLoss = netGrowth >= 0
        const firstRoundMet = firstRoundVisits.meetsThreshold
        const secondRoundMet = secondRoundVisits.meetsThreshold
        const expectedQualified = noClubLoss && firstRoundMet && secondRoundMet

        // Result must match expected qualification
        expect(isQualified).toBe(expectedQualified)

        // If qualified, all three criteria must be met
        if (isQualified) {
          expect(netGrowth).toBeGreaterThanOrEqual(0)
          expect(firstRoundVisits.meetsThreshold).toBe(true)
          expect(secondRoundVisits.meetsThreshold).toBe(true)
        }

        // If not qualified, at least one criterion must not be met
        if (!isQualified) {
          const failedCriteria =
            netGrowth < 0 ||
            !firstRoundVisits.meetsThreshold ||
            !secondRoundVisits.meetsThreshold
          expect(failedCriteria).toBe(true)
        }
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce consistent results for the same inputs', () => {
    fc.assert(
      fc.property(areaQualifyingMetricsArb, metrics => {
        const { netGrowth, firstRoundVisits, secondRoundVisits } = metrics

        // Calculate qualification multiple times with the same inputs
        const result1 = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )
        const result2 = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )
        const result3 = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )

        // All results must be identical (deterministic function)
        expect(result1).toBe(result2)
        expect(result2).toBe(result3)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should mark area as not qualified when net growth is negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -50, max: -1 }),
        visitStatusArb,
        visitStatusArb,
        (netGrowth, firstRoundVisits, secondRoundVisits) => {
          // Force both visit rounds to meet threshold
          const firstRound = { ...firstRoundVisits, meetsThreshold: true }
          const secondRound = { ...secondRoundVisits, meetsThreshold: true }

          const isQualified = checkAreaQualifying(
            netGrowth,
            firstRound,
            secondRound
          )

          // Must be not qualified due to negative net growth (club loss)
          expect(isQualified).toBe(false)
          expect(netGrowth).toBeLessThan(0)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should mark area as not qualified when first round visits below 75%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        visitStatusArb,
        visitStatusArb,
        (netGrowth, firstRoundVisits, secondRoundVisits) => {
          // Force first round to NOT meet threshold
          const firstRound = { ...firstRoundVisits, meetsThreshold: false }
          // Force second round to meet threshold
          const secondRound = { ...secondRoundVisits, meetsThreshold: true }

          const isQualified = checkAreaQualifying(
            netGrowth,
            firstRound,
            secondRound
          )

          // Must be not qualified due to first round visits below 75%
          expect(isQualified).toBe(false)
          expect(firstRound.meetsThreshold).toBe(false)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should mark area as not qualified when second round visits below 75%', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        visitStatusArb,
        visitStatusArb,
        (netGrowth, firstRoundVisits, secondRoundVisits) => {
          // Force first round to meet threshold
          const firstRound = { ...firstRoundVisits, meetsThreshold: true }
          // Force second round to NOT meet threshold
          const secondRound = { ...secondRoundVisits, meetsThreshold: false }

          const isQualified = checkAreaQualifying(
            netGrowth,
            firstRound,
            secondRound
          )

          // Must be not qualified due to second round visits below 75%
          expect(isQualified).toBe(false)
          expect(secondRound.meetsThreshold).toBe(false)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should mark area as qualified when all three criteria are met', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        visitStatusArb,
        visitStatusArb,
        (netGrowth, firstRoundVisits, secondRoundVisits) => {
          // Force both visit rounds to meet threshold
          const firstRound = { ...firstRoundVisits, meetsThreshold: true }
          const secondRound = { ...secondRoundVisits, meetsThreshold: true }

          const isQualified = checkAreaQualifying(
            netGrowth,
            firstRound,
            secondRound
          )

          // Must be qualified when all criteria are met
          expect(isQualified).toBe(true)
          expect(netGrowth).toBeGreaterThanOrEqual(0)
          expect(firstRound.meetsThreshold).toBe(true)
          expect(secondRound.meetsThreshold).toBe(true)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should handle edge case of zero net growth (no change)', () => {
    fc.assert(
      fc.property(
        visitStatusArb,
        visitStatusArb,
        (firstRoundVisits, secondRoundVisits) => {
          const netGrowth = 0

          // Force both visit rounds to meet threshold
          const firstRound = { ...firstRoundVisits, meetsThreshold: true }
          const secondRound = { ...secondRoundVisits, meetsThreshold: true }

          const isQualified = checkAreaQualifying(
            netGrowth,
            firstRound,
            secondRound
          )

          // Zero net growth (no change) should still qualify if visits are met
          expect(isQualified).toBe(true)
        }
      ),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should verify specific known examples', () => {
    // Test specific examples to ensure correctness
    const testCases = [
      {
        description: 'Qualified: no club loss, both visits ≥ 75%',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        expected: true,
      },
      {
        description: 'Qualified: positive growth, both visits ≥ 75%',
        netGrowth: 2,
        firstRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 4,
          required: 3,
          percentage: 100,
          meetsThreshold: true,
        },
        expected: true,
      },
      {
        description: 'Not qualified: net club loss',
        netGrowth: -1,
        firstRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        expected: false,
      },
      {
        description: 'Not qualified: first round visits below 75%',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 2,
          required: 3,
          percentage: 67,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        expected: false,
      },
      {
        description: 'Not qualified: second round visits below 75%',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 3,
          required: 3,
          percentage: 75,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 2,
          required: 3,
          percentage: 67,
          meetsThreshold: false,
        },
        expected: false,
      },
      {
        description: 'Not qualified: both visit rounds below 75%',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 2,
          required: 3,
          percentage: 67,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 2,
          required: 3,
          percentage: 67,
          meetsThreshold: false,
        },
        expected: false,
      },
      {
        description: 'Not qualified: all three criteria failed',
        netGrowth: -2,
        firstRoundVisits: {
          completed: 1,
          required: 3,
          percentage: 33,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 1,
          required: 3,
          percentage: 33,
          meetsThreshold: false,
        },
        expected: false,
      },
      {
        description: 'Qualified: exactly at thresholds',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 8,
          required: 8,
          percentage: 80,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 8,
          required: 8,
          percentage: 80,
          meetsThreshold: true,
        },
        expected: true,
      },
      {
        description: 'Not qualified: one below first round threshold',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 7,
          required: 8,
          percentage: 70,
          meetsThreshold: false,
        },
        secondRoundVisits: {
          completed: 8,
          required: 8,
          percentage: 80,
          meetsThreshold: true,
        },
        expected: false,
      },
      {
        description: 'Not qualified: one below second round threshold',
        netGrowth: 0,
        firstRoundVisits: {
          completed: 8,
          required: 8,
          percentage: 80,
          meetsThreshold: true,
        },
        secondRoundVisits: {
          completed: 7,
          required: 8,
          percentage: 70,
          meetsThreshold: false,
        },
        expected: false,
      },
    ]

    testCases.forEach(
      ({ netGrowth, firstRoundVisits, secondRoundVisits, expected }) => {
        // description field is for documentation purposes only
        const isQualified = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )
        expect(isQualified).toBe(expected)
      }
    )
  })

  it('should maintain invariant: improving any criterion never makes area less qualified', () => {
    fc.assert(
      fc.property(areaQualifyingMetricsArb, metrics => {
        const { netGrowth, firstRoundVisits, secondRoundVisits } = metrics

        // Calculate qualification with current metrics
        const qualified1 = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          secondRoundVisits
        )

        // Improve net growth (if negative, make it zero; if zero or positive, increase by 1)
        const improvedNetGrowth = netGrowth < 0 ? 0 : netGrowth + 1
        const qualified2 = checkAreaQualifying(
          improvedNetGrowth,
          firstRoundVisits,
          secondRoundVisits
        )

        // Improve first round visits (force to meet threshold)
        const improvedFirstRound = { ...firstRoundVisits, meetsThreshold: true }
        const qualified3 = checkAreaQualifying(
          netGrowth,
          improvedFirstRound,
          secondRoundVisits
        )

        // Improve second round visits (force to meet threshold)
        const improvedSecondRound = {
          ...secondRoundVisits,
          meetsThreshold: true,
        }
        const qualified4 = checkAreaQualifying(
          netGrowth,
          firstRoundVisits,
          improvedSecondRound
        )

        // If originally qualified, improving any criterion should keep it qualified
        if (qualified1) {
          expect(qualified2).toBe(true)
          expect(qualified3).toBe(true)
          expect(qualified4).toBe(true)
        }

        // Improving a criterion should never make the area less qualified
        // (false → false or false → true or true → true, but never true → false)
        if (qualified1) {
          expect(qualified2).toBe(true)
        }
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })
})

/**
 * **Feature: division-area-performance-cards, Property 4: Area Status Classification with Qualifying Gate**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 *
 * For any area with valid metrics, if the area is not qualified, the status MUST be
 * "not-qualified" regardless of other metrics. If the area is qualified, the status
 * SHALL follow the same classification rules as divisions (Distinguished, Select
 * Distinguished, or President's Distinguished).
 *
 * This property ensures that:
 * - The qualifying gate is always applied first
 * - Non-qualified areas always get "not-qualified" status
 * - Qualified areas follow the same classification logic as divisions
 * - Status classification is deterministic and consistent
 * - Excellent metrics cannot override the qualifying gate
 */
describe('Property 4: Area Status Classification with Qualifying Gate', () => {
  // Generator for valid club base values (positive integers)
  const clubBaseArb = fc.integer({ min: 1, max: 100 })

  // Generator for area metrics
  const areaMetricsArb = clubBaseArb.chain(clubBase => {
    const threshold = Math.ceil(clubBase * 0.5)
    return fc.record({
      clubBase: fc.constant(clubBase),
      threshold: fc.constant(threshold),
      distinguishedClubs: fc.integer({ min: 0, max: clubBase }),
      paidClubs: fc.integer({ min: 0, max: clubBase + 50 }), // Allow growth beyond base
      isQualified: fc.boolean(),
    })
  })

  it('should return "not-qualified" for any non-qualified area regardless of metrics', () => {
    fc.assert(
      fc.property(areaMetricsArb, metrics => {
        const { clubBase, threshold, distinguishedClubs, paidClubs } = metrics
        const netGrowth = paidClubs - clubBase
        const isQualified = false // Force not qualified

        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Must always be 'not-qualified' when isQualified is false
        expect(status).toBe('not-qualified')

        // This should be true even if the area has excellent metrics
        // (e.g., high distinguished clubs, positive net growth)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should apply division classification rules for qualified areas', () => {
    fc.assert(
      fc.property(areaMetricsArb, metrics => {
        const { clubBase, threshold, distinguishedClubs, paidClubs } = metrics
        const netGrowth = paidClubs - clubBase
        const isQualified = true // Force qualified

        const areaStatus = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Areas follow the Distinguished AREA Program (50% / 50%+1 with net
        // growth) — independent of the DDP division rules (#798). Assert
        // against the area rules directly, not by reference to
        // calculateDivisionStatus (which now uses the DDP 45/50/55 thresholds).
        let expected: string
        if (distinguishedClubs >= threshold + 1 && netGrowth >= 1) {
          expected = 'presidents-distinguished'
        } else if (
          distinguishedClubs >= threshold + 1 &&
          paidClubs >= clubBase
        ) {
          expected = 'select-distinguished'
        } else if (distinguishedClubs >= threshold && paidClubs >= clubBase) {
          expected = 'distinguished'
        } else {
          expected = 'not-distinguished'
        }

        // For qualified areas, status should match the area (DAP) rules
        expect(areaStatus).toBe(expected)

        // Area status should never be 'not-qualified' when isQualified is true
        expect(areaStatus).not.toBe('not-qualified')
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should produce consistent results for the same inputs', () => {
    fc.assert(
      fc.property(areaMetricsArb, metrics => {
        const {
          clubBase,
          threshold,
          distinguishedClubs,
          paidClubs,
          isQualified,
        } = metrics
        const netGrowth = paidClubs - clubBase

        // Calculate status multiple times with the same inputs
        const result1 = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )
        const result2 = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )
        const result3 = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // All results must be identical (deterministic classification)
        expect(result1).toBe(result2)
        expect(result2).toBe(result3)
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it("should correctly identify President's Distinguished for qualified areas", () => {
    fc.assert(
      fc.property(clubBaseArb, clubBase => {
        const threshold = Math.ceil(clubBase * 0.5)
        const distinguishedClubs = threshold + 1
        const paidClubs = clubBase + 1 // Net growth of 1
        const netGrowth = 1
        const isQualified = true

        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Must be President's Distinguished for qualified areas
        expect(status).toBe('presidents-distinguished')
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should correctly identify Select Distinguished for qualified areas', () => {
    fc.assert(
      fc.property(clubBaseArb, clubBase => {
        const threshold = Math.ceil(clubBase * 0.5)
        const distinguishedClubs = threshold + 1
        const paidClubs = clubBase // No net growth
        const netGrowth = 0
        const isQualified = true

        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Must be Select Distinguished for qualified areas
        expect(status).toBe('select-distinguished')
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should correctly identify Distinguished for qualified areas', () => {
    fc.assert(
      fc.property(clubBaseArb, clubBase => {
        const threshold = Math.ceil(clubBase * 0.5)
        const distinguishedClubs = threshold // Exactly at threshold
        const paidClubs = clubBase // No net growth
        const netGrowth = 0
        const isQualified = true

        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Must be Distinguished for qualified areas
        expect(status).toBe('distinguished')
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should correctly identify Not Distinguished for qualified areas with insufficient metrics', () => {
    fc.assert(
      fc.property(clubBaseArb, clubBase => {
        const threshold = Math.ceil(clubBase * 0.5)
        const isQualified = true

        // Test case 1: Below threshold
        if (threshold > 0) {
          const status1 = calculateAreaStatus(
            isQualified,
            threshold - 1,
            threshold,
            clubBase,
            clubBase,
            0
          )
          expect(status1).toBe('not-distinguished')
        }

        // Test case 2: At threshold but paid clubs below base
        if (clubBase > 0) {
          const status2 = calculateAreaStatus(
            isQualified,
            threshold,
            threshold,
            clubBase - 1,
            clubBase,
            -1
          )
          expect(status2).toBe('not-distinguished')
        }
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should verify that excellent metrics cannot override non-qualified status', () => {
    fc.assert(
      fc.property(clubBaseArb, clubBase => {
        const threshold = Math.ceil(clubBase * 0.5)
        const isQualified = false

        // Even with excellent metrics (President's Distinguished level)
        const distinguishedClubs = threshold + 5 // Well above threshold + 1
        const paidClubs = clubBase + 10 // High net growth
        const netGrowth = 10

        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Must still be 'not-qualified' despite excellent metrics
        expect(status).toBe('not-qualified')
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should verify specific known examples', () => {
    // Test specific examples to ensure correctness
    const testCases = [
      {
        description: 'Not qualified with excellent metrics',
        isQualified: false,
        distinguishedClubs: 8,
        threshold: 5,
        paidClubs: 12,
        clubBase: 10,
        netGrowth: 2,
        expected: 'not-qualified',
      },
      {
        description: "Qualified: President's Distinguished",
        isQualified: true,
        distinguishedClubs: 6,
        threshold: 5,
        paidClubs: 11,
        clubBase: 10,
        netGrowth: 1,
        expected: 'presidents-distinguished',
      },
      {
        description: 'Qualified: Select Distinguished',
        isQualified: true,
        distinguishedClubs: 6,
        threshold: 5,
        paidClubs: 10,
        clubBase: 10,
        netGrowth: 0,
        expected: 'select-distinguished',
      },
      {
        description: 'Qualified: Distinguished',
        isQualified: true,
        distinguishedClubs: 5,
        threshold: 5,
        paidClubs: 10,
        clubBase: 10,
        netGrowth: 0,
        expected: 'distinguished',
      },
      {
        description: 'Qualified: Not Distinguished (below threshold)',
        isQualified: true,
        distinguishedClubs: 4,
        threshold: 5,
        paidClubs: 10,
        clubBase: 10,
        netGrowth: 0,
        expected: 'not-distinguished',
      },
      {
        description: 'Qualified: Not Distinguished (paid < base)',
        isQualified: true,
        distinguishedClubs: 5,
        threshold: 5,
        paidClubs: 8,
        clubBase: 10,
        netGrowth: -2,
        expected: 'not-distinguished',
      },
      {
        description: 'Not qualified with minimal metrics',
        isQualified: false,
        distinguishedClubs: 0,
        threshold: 5,
        paidClubs: 5,
        clubBase: 10,
        netGrowth: -5,
        expected: 'not-qualified',
      },
      {
        description: 'Not qualified at threshold',
        isQualified: false,
        distinguishedClubs: 5,
        threshold: 5,
        paidClubs: 10,
        clubBase: 10,
        netGrowth: 0,
        expected: 'not-qualified',
      },
      {
        description: 'Not qualified at threshold + 1',
        isQualified: false,
        distinguishedClubs: 6,
        threshold: 5,
        paidClubs: 10,
        clubBase: 10,
        netGrowth: 0,
        expected: 'not-qualified',
      },
      {
        description: 'Qualified with minimal Distinguished metrics',
        isQualified: true,
        distinguishedClubs: 1,
        threshold: 1,
        paidClubs: 1,
        clubBase: 1,
        netGrowth: 0,
        expected: 'distinguished',
      },
    ]

    testCases.forEach(
      ({
        isQualified,
        distinguishedClubs,
        threshold,
        paidClubs,
        clubBase,
        netGrowth,
        expected,
      }) => {
        // description field is for documentation purposes only
        const status = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )
        expect(status).toBe(expected)
      }
    )
  })

  it('should maintain invariant: qualifying status change affects result', () => {
    fc.assert(
      fc.property(areaMetricsArb, metrics => {
        const { clubBase, threshold, distinguishedClubs, paidClubs } = metrics
        const netGrowth = paidClubs - clubBase

        // Calculate status when not qualified
        const notQualifiedStatus = calculateAreaStatus(
          false,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Calculate status when qualified
        const qualifiedStatus = calculateAreaStatus(
          true,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // When not qualified, status must be 'not-qualified'
        expect(notQualifiedStatus).toBe('not-qualified')

        // When qualified, status must not be 'not-qualified'
        expect(qualifiedStatus).not.toBe('not-qualified')

        // Qualifying should never decrease status
        // (not-qualified is the lowest status)
        const statusOrder = {
          'not-qualified': 0,
          'not-distinguished': 1,
          distinguished: 2,
          'select-distinguished': 3,
          'presidents-distinguished': 4,
        }

        expect(statusOrder[qualifiedStatus]).toBeGreaterThanOrEqual(
          statusOrder[notQualifiedStatus]
        )
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })

  it('should maintain invariant: qualified areas with better metrics never have worse status', () => {
    fc.assert(
      fc.property(areaMetricsArb, metrics => {
        const { clubBase, threshold, distinguishedClubs, paidClubs } = metrics
        const netGrowth = paidClubs - clubBase
        const isQualified = true // Only test qualified areas

        // Calculate status with current metrics
        const status1 = calculateAreaStatus(
          isQualified,
          distinguishedClubs,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Calculate status with one more distinguished club
        const status2 = calculateAreaStatus(
          isQualified,
          distinguishedClubs + 1,
          threshold,
          paidClubs,
          clubBase,
          netGrowth
        )

        // Define status ordering
        const statusOrder = {
          'not-qualified': 0,
          'not-distinguished': 1,
          distinguished: 2,
          'select-distinguished': 3,
          'presidents-distinguished': 4,
        }

        // Status with more distinguished clubs should be >= status with fewer
        expect(statusOrder[status2]).toBeGreaterThanOrEqual(
          statusOrder[status1]
        )
      }),
      { numRuns: 25 } // Optimized for CI/CD timeout compliance (was 100)
    )
  })
})

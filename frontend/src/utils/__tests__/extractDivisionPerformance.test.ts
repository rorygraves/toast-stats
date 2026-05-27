/**
 * Unit Tests for Division and Area Performance Data Extraction
 *
 * These tests verify specific examples and edge cases for data extraction
 * functions that transform district snapshot JSON into typed performance data.
 *
 * Requirements: 1.4, 7.1, 7.2, 7.5
 */

import { describe, it, expect } from 'vitest'
import {
  extractVisitData,
  extractDivisionPerformance,
  determineDistinguishedLevel,
  countVisitCompletions,
} from '../extractDivisionPerformance.js'

describe('extractVisitData', () => {
  /**
   * Test missing "Nov Visit award" field
   * Requirements: 7.5
   */
  it('should handle missing "Nov Visit award" field', () => {
    // Arrange: Area data without Nov Visit award
    const areaData = {
      'May visit award': '4',
      Area: 'A1',
    }
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: First round should default to zero visits
    expect(result.firstRound.completed).toBe(0)
    expect(result.firstRound.required).toBe(3) // 75% of 4 = 3
    expect(result.firstRound.percentage).toBe(0)
    expect(result.firstRound.meetsThreshold).toBe(false)

    // Second round should be extracted correctly
    expect(result.secondRound.completed).toBe(4)
    expect(result.secondRound.meetsThreshold).toBe(true)
  })

  /**
   * Test missing "May visit award" field
   * Requirements: 7.5
   */
  it('should handle missing "May visit award" field', () => {
    // Arrange: Area data without May Visit award
    const areaData = {
      'Nov Visit award': '3',
      Area: 'A1',
    }
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: First round should be extracted correctly
    expect(result.firstRound.completed).toBe(3)
    expect(result.firstRound.meetsThreshold).toBe(true)

    // Second round should default to zero visits
    expect(result.secondRound.completed).toBe(0)
    expect(result.secondRound.required).toBe(3) // 75% of 4 = 3
    expect(result.secondRound.percentage).toBe(0)
    expect(result.secondRound.meetsThreshold).toBe(false)
  })

  /**
   * Test missing both visit fields
   * Requirements: 7.5
   */
  it('should handle missing both visit award fields', () => {
    // Arrange: Area data without any visit awards
    const areaData = {
      Area: 'A1',
      Division: 'A',
    }
    const clubBase = 5

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Both rounds should default to zero visits
    expect(result.firstRound.completed).toBe(0)
    expect(result.firstRound.required).toBe(4) // 75% of 5 = 3.75, rounded up to 4
    expect(result.firstRound.meetsThreshold).toBe(false)

    expect(result.secondRound.completed).toBe(0)
    expect(result.secondRound.required).toBe(4)
    expect(result.secondRound.meetsThreshold).toBe(false)
  })

  /**
   * Test null area data
   * Requirements: 7.5
   */
  it('should handle null area data', () => {
    // Arrange: Null area data
    const areaData = null
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Both rounds should default to zero visits
    expect(result.firstRound.completed).toBe(0)
    expect(result.secondRound.completed).toBe(0)
  })

  /**
   * Test undefined area data
   * Requirements: 7.5
   */
  it('should handle undefined area data', () => {
    // Arrange: Undefined area data
    const areaData = undefined
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Both rounds should default to zero visits
    expect(result.firstRound.completed).toBe(0)
    expect(result.secondRound.completed).toBe(0)
  })

  /**
   * Test empty object area data
   * Requirements: 7.5
   */
  it('should handle empty object area data', () => {
    // Arrange: Empty object
    const areaData = {}
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Both rounds should default to zero visits
    expect(result.firstRound.completed).toBe(0)
    expect(result.secondRound.completed).toBe(0)
  })

  /**
   * Test invalid visit values (non-numeric strings)
   * Requirements: 7.5
   */
  it('should handle invalid visit values', () => {
    // Arrange: Area data with invalid visit values
    const areaData = {
      'Nov Visit award': 'invalid',
      'May visit award': 'not-a-number',
    }
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Invalid values should be treated as zero
    expect(result.firstRound.completed).toBe(0)
    expect(result.secondRound.completed).toBe(0)
  })

  /**
   * Test valid visit data extraction
   * Requirements: 7.1, 7.2
   */
  it('should extract valid visit data correctly', () => {
    // Arrange: Area data with valid visit awards
    const areaData = {
      'Nov Visit award': '3',
      'May visit award': '4',
    }
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Both rounds should be extracted correctly
    expect(result.firstRound.completed).toBe(3)
    expect(result.firstRound.required).toBe(3) // 75% of 4 = 3
    expect(result.firstRound.percentage).toBe(75)
    expect(result.firstRound.meetsThreshold).toBe(true)

    expect(result.secondRound.completed).toBe(4)
    expect(result.secondRound.required).toBe(3)
    expect(result.secondRound.percentage).toBe(100)
    expect(result.secondRound.meetsThreshold).toBe(true)
  })

  /**
   * Test numeric visit values (not strings)
   * Requirements: 7.1, 7.2
   */
  it('should handle numeric visit values', () => {
    // Arrange: Area data with numeric visit values
    const areaData = {
      'Nov Visit award': 3,
      'May visit award': 4,
    }
    const clubBase = 4

    // Act: Extract visit data
    const result = extractVisitData(areaData, clubBase)

    // Assert: Numeric values should be handled correctly
    expect(result.firstRound.completed).toBe(3)
    expect(result.secondRound.completed).toBe(4)
  })
})

describe('extractDivisionPerformance', () => {
  /**
   * A division's requiredDistinguishedClubs (the value the progress pill counts
   * toward and the "threshold met" indicator compares against) must use the DDP
   * Distinguished threshold of 45% of club base — NOT the 50% area/DAP rule.
   * Otherwise the pill demands more distinguished clubs than the recognition
   * badge requires and the two disagree (D61 Division H, base 17: badge says
   * Distinguished at 8 clubs, but a 50% pill demanded 9). See #798 / #799.
   */
  it('derives division requiredDistinguishedClubs from DDP 45% of club base', () => {
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'H',
          'Division Club Base': '17',
          Club: 'C1',
        },
      ],
      clubPerformance: [],
    }

    const result = extractDivisionPerformance(snapshot)

    expect(result).toHaveLength(1)
    expect(result[0].clubBase).toBe(17)
    // ceil(17 * 0.45) = 8 (DDP Distinguished); the old 50% rule gave 9
    expect(result[0].requiredDistinguishedClubs).toBe(8)
  })

  /**
   * Test with empty divisions
   * Requirements: 1.4
   */
  it('should handle empty divisions array', () => {
    // Arrange: Snapshot with empty division performance
    const snapshot = {
      divisionPerformance: [],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should return empty array
    expect(result).toEqual([])
  })

  /**
   * Test with missing division performance
   * Requirements: 1.4
   */
  it('should handle missing divisionPerformance field', () => {
    // Arrange: Snapshot without divisionPerformance
    const snapshot = {
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should return empty array
    expect(result).toEqual([])
  })

  /**
   * Test with null snapshot
   * Requirements: 1.4
   */
  it('should handle null snapshot', () => {
    // Arrange: Null snapshot
    const snapshot = null

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should return empty array
    expect(result).toEqual([])
  })

  /**
   * Test with undefined snapshot
   * Requirements: 1.4
   */
  it('should handle undefined snapshot', () => {
    // Arrange: Undefined snapshot
    const snapshot = undefined

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should return empty array
    expect(result).toEqual([])
  })

  /**
   * Test with missing area data
   * Requirements: 1.4
   */
  it('should handle missing area data', () => {
    // Arrange: Snapshot with division but no club performance
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'A',
          'Club Base': '10',
          'Paid Clubs': '12',
          'Distinguished Clubs': '6',
        },
      ],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should return division with empty areas array
    expect(result).toHaveLength(1)
    expect(result[0].divisionId).toBe('A')
    expect(result[0].areas).toEqual([])
  })

  /**
   * Test with invalid numeric values
   * Requirements: 1.4
   */
  it('should handle invalid numeric values', () => {
    // Arrange: Snapshot with invalid numeric values
    // Note: "Division Club Base" with invalid value should fall back to counting clubs (1 club)
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'A',
          'Division Club Base': 'invalid',
          'Club Base': 'invalid',
          'Paid Clubs': 'not-a-number',
          'Distinguished Clubs': '',
        },
      ],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Invalid "Division Club Base" falls back to counting clubs (1 club in this case)
    expect(result).toHaveLength(1)
    expect(result[0].clubBase).toBe(1) // Falls back to club count
    expect(result[0].paidClubs).toBe(0)
    expect(result[0].distinguishedClubs).toBe(0)
  })

  /**
   * Test division sorting by identifier
   * Requirements: 1.3
   */
  it('should sort divisions by identifier', () => {
    // Arrange: Snapshot with divisions in non-alphabetical order
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'C',
          'Club Base': '10',
          'Paid Clubs': '10',
          'Distinguished Clubs': '5',
        },
        {
          Division: 'A',
          'Club Base': '10',
          'Paid Clubs': '10',
          'Distinguished Clubs': '5',
        },
        {
          Division: 'B',
          'Club Base': '10',
          'Paid Clubs': '10',
          'Distinguished Clubs': '5',
        },
      ],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Divisions should be sorted alphabetically
    expect(result).toHaveLength(3)
    expect(result[0].divisionId).toBe('A')
    expect(result[1].divisionId).toBe('B')
    expect(result[2].divisionId).toBe('C')
  })

  /**
   * Test area sorting by identifier
   * Requirements: 6.8
   */
  it('should sort areas by identifier within each division', () => {
    // Arrange: Snapshot with areas in non-alphabetical order
    // Note: Areas are extracted from divisionPerformance, not clubPerformance
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'A',
          Area: '03',
          'Division Club Base': '3',
          Club: 'Club1',
        },
        {
          Division: 'A',
          Area: '01',
          'Division Club Base': '3',
          Club: 'Club2',
        },
        {
          Division: 'A',
          Area: '02',
          'Division Club Base': '3',
          Club: 'Club3',
        },
      ],
      clubPerformance: [
        {
          'Club Number': 'Club1',
          'Club Status': 'Active',
          'Club Distinguished Status': 'Distinguished',
        },
        {
          'Club Number': 'Club2',
          'Club Status': 'Active',
          'Club Distinguished Status': 'Distinguished',
        },
        {
          'Club Number': 'Club3',
          'Club Status': 'Active',
          'Club Distinguished Status': 'Distinguished',
        },
      ],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Areas should be sorted alphabetically
    expect(result).toHaveLength(1)
    expect(result[0].areas).toHaveLength(3)
    expect(result[0].areas[0].areaId).toBe('01')
    expect(result[0].areas[1].areaId).toBe('02')
    expect(result[0].areas[2].areaId).toBe('03')
  })

  /**
   * Test duplicate division handling (clubs in same division are grouped)
   * Requirements: 11.1, 11.2, 11.3
   */
  it('should deduplicate divisions and retain first occurrence', () => {
    // Arrange: Snapshot with multiple clubs in same division
    // Note: The implementation groups clubs by division, so multiple entries
    // with the same Division are aggregated, not deduplicated
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'A',
          'Division Club Base': '10',
          Club: 'Club1',
        },
        {
          Division: 'B',
          'Division Club Base': '8',
          Club: 'Club2',
        },
        {
          Division: 'A', // Same division, different club
          'Division Club Base': '10',
          Club: 'Club3',
        },
      ],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should have 2 divisions (A and B) with clubs grouped
    expect(result).toHaveLength(2)
    expect(result[0].divisionId).toBe('A')
    expect(result[1].divisionId).toBe('B')

    // Assert: Division A should have clubBase from "Division Club Base" field
    expect(result[0].clubBase).toBe(10)
  })

  /**
   * Test multiple clubs in same division (clubs are grouped by division)
   * Requirements: 11.1, 11.2, 11.3
   */
  it('should handle multiple duplicate divisions', () => {
    // Arrange: Snapshot with multiple clubs in same division
    // Note: The implementation groups clubs by division
    const snapshot = {
      divisionPerformance: [
        {
          Division: 'A',
          'Division Club Base': '10',
          Club: 'Club1',
        },
        {
          Division: 'A', // Same division
          'Division Club Base': '10',
          Club: 'Club2',
        },
        {
          Division: 'B',
          'Division Club Base': '8',
          Club: 'Club3',
        },
        {
          Division: 'A', // Same division
          'Division Club Base': '10',
          Club: 'Club4',
        },
      ],
      clubPerformance: [],
    }

    // Act: Extract division performance
    const result = extractDivisionPerformance(snapshot)

    // Assert: Should have 2 unique divisions (clubs grouped)
    expect(result).toHaveLength(2)
    expect(result[0].divisionId).toBe('A')
    expect(result[1].divisionId).toBe('B')

    // Assert: Division A should have clubBase from "Division Club Base" field
    expect(result[0].clubBase).toBe(10)
  })

  /**
   * Tests for Division Club Base extraction
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  describe('Division Club Base extraction', () => {
    /**
     * Test with valid "Division Club Base" field present
     * Requirements: 1.1, 1.2
     */
    it('should use "Division Club Base" field value when present and valid', () => {
      // Arrange: Snapshot with valid "Division Club Base" field
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            'Division Club Base': '15',
            Club: 'Club1',
          },
          {
            Division: 'A',
            'Division Club Base': '15',
            Club: 'Club2',
          },
          {
            Division: 'A',
            'Division Club Base': '15',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should use the "Division Club Base" value (15), not the club count (3)
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('A')
      expect(result[0].clubBase).toBe(15)
    })

    /**
     * Test reading "Division Club Base" from any single club record
     * Requirements: 1.3
     */
    it('should read "Division Club Base" from first club since all clubs have same value', () => {
      // Arrange: Multiple clubs in division, all with same "Division Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'B',
            'Division Club Base': '8',
            Club: 'Club1',
          },
          {
            Division: 'B',
            'Division Club Base': '8',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should use the "Division Club Base" value from first club
      expect(result).toHaveLength(1)
      expect(result[0].clubBase).toBe(8)
    })

    /**
     * Test with numeric "Division Club Base" value (not string)
     * Requirements: 1.1, 1.2
     */
    it('should handle numeric "Division Club Base" value', () => {
      // Arrange: Snapshot with numeric "Division Club Base" field
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'C',
            'Division Club Base': 12,
            Club: 'Club1',
          },
          {
            Division: 'C',
            'Division Club Base': 12,
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should handle numeric value correctly
      expect(result).toHaveLength(1)
      expect(result[0].clubBase).toBe(12)
    })

    /**
     * Test with missing "Division Club Base" field (fallback to count)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" field is missing', () => {
      // Arrange: Snapshot without "Division Club Base" field
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'D',
            Club: 'Club1',
          },
          {
            Division: 'D',
            Club: 'Club2',
          },
          {
            Division: 'D',
            Club: 'Club3',
          },
          {
            Division: 'D',
            Club: 'Club4',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (4 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('D')
      expect(result[0].clubBase).toBe(4)
    })

    /**
     * Test with invalid/non-numeric "Division Club Base" value (fallback to count)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" is invalid string', () => {
      // Arrange: Snapshot with invalid "Division Club Base" value
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'E',
            'Division Club Base': 'invalid',
            Club: 'Club1',
          },
          {
            Division: 'E',
            'Division Club Base': 'invalid',
            Club: 'Club2',
          },
          {
            Division: 'E',
            'Division Club Base': 'invalid',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (3 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('E')
      expect(result[0].clubBase).toBe(3)
    })

    /**
     * Test with "Division Club Base" of 0 (fallback to count - 0 is invalid)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" is 0', () => {
      // Arrange: Snapshot with "Division Club Base" of 0
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'F',
            'Division Club Base': '0',
            Club: 'Club1',
          },
          {
            Division: 'F',
            'Division Club Base': '0',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (2 clubs) since 0 is invalid
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('F')
      expect(result[0].clubBase).toBe(2)
    })

    /**
     * Test with "Division Club Base" of negative value (fallback to count)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" is negative', () => {
      // Arrange: Snapshot with negative "Division Club Base" value
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'G',
            'Division Club Base': '-5',
            Club: 'Club1',
          },
          {
            Division: 'G',
            'Division Club Base': '-5',
            Club: 'Club2',
          },
          {
            Division: 'G',
            'Division Club Base': '-5',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (3 clubs) since negative is invalid
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('G')
      expect(result[0].clubBase).toBe(3)
    })

    /**
     * Test with "Division Club Base" as empty string (fallback to count)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" is empty string', () => {
      // Arrange: Snapshot with empty string "Division Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'H',
            'Division Club Base': '',
            Club: 'Club1',
          },
          {
            Division: 'H',
            'Division Club Base': '',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (2 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('H')
      expect(result[0].clubBase).toBe(2)
    })

    /**
     * Test with "Division Club Base" as null (fallback to count)
     * Requirements: 1.4
     */
    it('should fall back to counting clubs when "Division Club Base" is null', () => {
      // Arrange: Snapshot with null "Division Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'I',
            'Division Club Base': null,
            Club: 'Club1',
          },
          {
            Division: 'I',
            'Division Club Base': null,
            Club: 'Club2',
          },
          {
            Division: 'I',
            'Division Club Base': null,
            Club: 'Club3',
          },
          {
            Division: 'I',
            'Division Club Base': null,
            Club: 'Club4',
          },
          {
            Division: 'I',
            'Division Club Base': null,
            Club: 'Club5',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (5 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('I')
      expect(result[0].clubBase).toBe(5)
    })

    /**
     * Test multiple divisions with different "Division Club Base" values
     * Requirements: 1.1, 1.2, 1.3
     */
    it('should correctly extract "Division Club Base" for multiple divisions', () => {
      // Arrange: Snapshot with multiple divisions, each with different club base
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            'Division Club Base': '10',
            Club: 'Club1',
          },
          {
            Division: 'A',
            'Division Club Base': '10',
            Club: 'Club2',
          },
          {
            Division: 'B',
            'Division Club Base': '7',
            Club: 'Club3',
          },
          {
            Division: 'C',
            'Division Club Base': '12',
            Club: 'Club4',
          },
          {
            Division: 'C',
            'Division Club Base': '12',
            Club: 'Club5',
          },
          {
            Division: 'C',
            'Division Club Base': '12',
            Club: 'Club6',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Each division should have correct "Division Club Base"
      expect(result).toHaveLength(3)
      expect(result[0].divisionId).toBe('A')
      expect(result[0].clubBase).toBe(10)
      expect(result[1].divisionId).toBe('B')
      expect(result[1].clubBase).toBe(7)
      expect(result[2].divisionId).toBe('C')
      expect(result[2].clubBase).toBe(12)
    })
  })

  /**
   * Tests for Area Club Base extraction
   * Requirements: 2.1, 2.2, 2.3, 2.4
   */
  describe('Area Club Base extraction', () => {
    /**
     * Test with valid "Area Club Base" field present
     * Requirements: 2.1, 2.2
     */
    it('should use "Area Club Base" field value when present and valid', () => {
      // Arrange: Snapshot with valid "Area Club Base" field
      // Area has 3 clubs but "Area Club Base" is 8
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '10',
            'Area Club Base': '8',
            Club: 'Club1',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '10',
            'Area Club Base': '8',
            Club: 'Club2',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '10',
            'Area Club Base': '8',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should use the "Area Club Base" value (8), not the club count (3)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('01')
      expect(result[0].areas[0].clubBase).toBe(8)
    })

    /**
     * Test reading "Area Club Base" from any single club record
     * Requirements: 2.3
     */
    it('should read "Area Club Base" from first club since all clubs have same value', () => {
      // Arrange: Multiple clubs in area, all with same "Area Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'B',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club1',
          },
          {
            Division: 'B',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should use the "Area Club Base" value from first club
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].clubBase).toBe(5)
    })

    /**
     * Test with numeric "Area Club Base" value (not string)
     * Requirements: 2.1, 2.2
     */
    it('should handle numeric "Area Club Base" value', () => {
      // Arrange: Snapshot with numeric "Area Club Base" field
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'C',
            Area: '03',
            'Division Club Base': 6,
            'Area Club Base': 6,
            Club: 'Club1',
          },
          {
            Division: 'C',
            Area: '03',
            'Division Club Base': 6,
            'Area Club Base': 6,
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should handle numeric value correctly
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].clubBase).toBe(6)
    })

    /**
     * Test with missing "Area Club Base" field (fallback to count)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" field is missing', () => {
      // Arrange: Snapshot without "Area Club Base" field
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'D',
            Area: '04',
            'Division Club Base': '4',
            Club: 'Club1',
          },
          {
            Division: 'D',
            Area: '04',
            'Division Club Base': '4',
            Club: 'Club2',
          },
          {
            Division: 'D',
            Area: '04',
            'Division Club Base': '4',
            Club: 'Club3',
          },
          {
            Division: 'D',
            Area: '04',
            'Division Club Base': '4',
            Club: 'Club4',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (4 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('04')
      expect(result[0].areas[0].clubBase).toBe(4)
    })

    /**
     * Test with invalid/non-numeric "Area Club Base" value (fallback to count)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" is invalid string', () => {
      // Arrange: Snapshot with invalid "Area Club Base" value
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'E',
            Area: '05',
            'Division Club Base': '3',
            'Area Club Base': 'invalid',
            Club: 'Club1',
          },
          {
            Division: 'E',
            Area: '05',
            'Division Club Base': '3',
            'Area Club Base': 'invalid',
            Club: 'Club2',
          },
          {
            Division: 'E',
            Area: '05',
            'Division Club Base': '3',
            'Area Club Base': 'invalid',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (3 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('05')
      expect(result[0].areas[0].clubBase).toBe(3)
    })

    /**
     * Test with "Area Club Base" of 0 (fallback to count - 0 is invalid)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" is 0', () => {
      // Arrange: Snapshot with "Area Club Base" of 0
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'F',
            Area: '06',
            'Division Club Base': '2',
            'Area Club Base': '0',
            Club: 'Club1',
          },
          {
            Division: 'F',
            Area: '06',
            'Division Club Base': '2',
            'Area Club Base': '0',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (2 clubs) since 0 is invalid
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('06')
      expect(result[0].areas[0].clubBase).toBe(2)
    })

    /**
     * Test with "Area Club Base" of negative value (fallback to count)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" is negative', () => {
      // Arrange: Snapshot with negative "Area Club Base" value
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'G',
            Area: '07',
            'Division Club Base': '3',
            'Area Club Base': '-5',
            Club: 'Club1',
          },
          {
            Division: 'G',
            Area: '07',
            'Division Club Base': '3',
            'Area Club Base': '-5',
            Club: 'Club2',
          },
          {
            Division: 'G',
            Area: '07',
            'Division Club Base': '3',
            'Area Club Base': '-5',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (3 clubs) since negative is invalid
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('07')
      expect(result[0].areas[0].clubBase).toBe(3)
    })

    /**
     * Test with "Area Club Base" as empty string (fallback to count)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" is empty string', () => {
      // Arrange: Snapshot with empty string "Area Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'H',
            Area: '08',
            'Division Club Base': '2',
            'Area Club Base': '',
            Club: 'Club1',
          },
          {
            Division: 'H',
            Area: '08',
            'Division Club Base': '2',
            'Area Club Base': '',
            Club: 'Club2',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (2 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('08')
      expect(result[0].areas[0].clubBase).toBe(2)
    })

    /**
     * Test with "Area Club Base" as null (fallback to count)
     * Requirements: 2.4
     */
    it('should fall back to counting clubs when "Area Club Base" is null', () => {
      // Arrange: Snapshot with null "Area Club Base"
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'I',
            Area: '09',
            'Division Club Base': '5',
            'Area Club Base': null,
            Club: 'Club1',
          },
          {
            Division: 'I',
            Area: '09',
            'Division Club Base': '5',
            'Area Club Base': null,
            Club: 'Club2',
          },
          {
            Division: 'I',
            Area: '09',
            'Division Club Base': '5',
            'Area Club Base': null,
            Club: 'Club3',
          },
          {
            Division: 'I',
            Area: '09',
            'Division Club Base': '5',
            'Area Club Base': null,
            Club: 'Club4',
          },
          {
            Division: 'I',
            Area: '09',
            'Division Club Base': '5',
            'Area Club Base': null,
            Club: 'Club5',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should fall back to counting clubs (5 clubs)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('09')
      expect(result[0].areas[0].clubBase).toBe(5)
    })

    /**
     * Test multiple areas with different "Area Club Base" values
     * Requirements: 2.1, 2.2, 2.3
     */
    it('should correctly extract "Area Club Base" for multiple areas in same division', () => {
      // Arrange: Snapshot with multiple areas, each with different club base
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'J',
            Area: '01',
            'Division Club Base': '12',
            'Area Club Base': '4',
            Club: 'Club1',
          },
          {
            Division: 'J',
            Area: '01',
            'Division Club Base': '12',
            'Area Club Base': '4',
            Club: 'Club2',
          },
          {
            Division: 'J',
            Area: '02',
            'Division Club Base': '12',
            'Area Club Base': '5',
            Club: 'Club3',
          },
          {
            Division: 'J',
            Area: '02',
            'Division Club Base': '12',
            'Area Club Base': '5',
            Club: 'Club4',
          },
          {
            Division: 'J',
            Area: '02',
            'Division Club Base': '12',
            'Area Club Base': '5',
            Club: 'Club5',
          },
          {
            Division: 'J',
            Area: '03',
            'Division Club Base': '12',
            'Area Club Base': '3',
            Club: 'Club6',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Each area should have correct "Area Club Base"
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(3)
      expect(result[0].areas[0].areaId).toBe('01')
      expect(result[0].areas[0].clubBase).toBe(4)
      expect(result[0].areas[1].areaId).toBe('02')
      expect(result[0].areas[1].clubBase).toBe(5)
      expect(result[0].areas[2].areaId).toBe('03')
      expect(result[0].areas[2].clubBase).toBe(3)
    })

    /**
     * Test areas across multiple divisions
     * Requirements: 2.1, 2.2, 2.3
     */
    it('should correctly extract "Area Club Base" for areas across multiple divisions', () => {
      // Arrange: Snapshot with areas in different divisions
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '6',
            'Area Club Base': '6',
            Club: 'Club1',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '6',
            'Area Club Base': '6',
            Club: 'Club2',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
          },
        ],
        clubPerformance: [],
      }

      // Act: Extract division performance
      const result = extractDivisionPerformance(snapshot)

      // Assert: Each division's area should have correct "Area Club Base"
      expect(result).toHaveLength(2)
      expect(result[0].divisionId).toBe('A')
      expect(result[0].areas[0].areaId).toBe('01')
      expect(result[0].areas[0].clubBase).toBe(6)
      expect(result[1].divisionId).toBe('B')
      expect(result[1].areas[0].areaId).toBe('01')
      expect(result[1].areas[0].clubBase).toBe(4)
    })
  })

  /**
   * Tests for Distinguished clubs counting
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  describe('Distinguished clubs counting', () => {
    /**
     * Test division with mixed distinguished statuses
     * Requirements: 3.1, 3.4
     */
    it('should correctly count distinguished clubs in division with mixed statuses', () => {
      // Arrange: Division with clubs having different distinguished statuses
      // 2 Distinguished, 1 Select, 1 Presidents, 1 not distinguished = 4 distinguished total
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club1',
            'Club Distinguished Status': 'Distinguished',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club2',
            'Club Distinguished Status': 'Select Distinguished',
          },
          {
            Division: 'A',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club3',
            'Club Distinguished Status': 'Presidents Distinguished',
          },
          {
            Division: 'A',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club4',
            'Club Distinguished Status': 'Distinguished',
          },
          {
            Division: 'A',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club5',
            'Club Distinguished Status': '', // Not distinguished
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Division should have 4 distinguished clubs
      expect(result).toHaveLength(1)
      expect(result[0].divisionId).toBe('A')
      expect(result[0].distinguishedClubs).toBe(4)
    })

    /**
     * Test area with mixed distinguished statuses
     * Requirements: 3.1, 3.4
     */
    it('should correctly count distinguished clubs in area with mixed statuses', () => {
      // Arrange: Area with clubs having different distinguished statuses
      // 1 Distinguished, 1 Select, 1 Smedley, 1 not distinguished = 3 distinguished total
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Club Distinguished Status': 'Distinguished',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Club Distinguished Status': 'Select Distinguished',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Club Distinguished Status': 'Smedley Distinguished',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Club Distinguished Status': 'none', // Not distinguished
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Area should have 3 distinguished clubs
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      expect(result[0].areas[0].areaId).toBe('01')
      expect(result[0].areas[0].distinguishedClubs).toBe(3)
    })

    /**
     * Test with "Club Distinguished Status" field present (uses status field)
     * Requirements: 3.2
     */
    it('should use "Club Distinguished Status" field when present', () => {
      // Arrange: Clubs with explicit status field set
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Club Distinguished Status': 'Presidents Distinguished',
            'Goals Met': '3', // Would not qualify by DCP alone
            'Active Members': '15',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Club Distinguished Status': 'Distinguished',
            'Goals Met': '2', // Would not qualify by DCP alone
            'Active Members': '12',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            'Club Distinguished Status': '', // Not distinguished
            'Goals Met': '10', // Would qualify by DCP
            'Active Members': '25',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should count 3 distinguished (2 from status field, 1 from DCP calculation)
      // Club1: Presidents Distinguished (from status)
      // Club2: Distinguished (from status)
      // Club3: Smedley (calculated from 10 goals + 25 members since status is empty)
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(3)
      expect(result[0].areas[0].distinguishedClubs).toBe(3)
    })

    /**
     * Test with missing status field but qualifying DCP data (calculates from DCP)
     * Requirements: 3.3
     */
    it('should calculate distinguished level from DCP when status field is missing', () => {
      // Arrange: Clubs without status field but with qualifying DCP data
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            // No "Club Distinguished Status" field
            'Goals Met': '5',
            'Active Members': '20',
            'Mem. Base': '18',
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            // No "Club Distinguished Status" field
            'Goals Met': '7',
            'Active Members': '19',
            'Mem. Base': '14', // Net growth = 5
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            // No "Club Distinguished Status" field
            'Goals Met': '9',
            'Active Members': '20',
            'Mem. Base': '18',
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            // No "Club Distinguished Status" field
            'Goals Met': '4', // Not enough goals
            'Active Members': '25',
            'Mem. Base': '20',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should count 3 distinguished (calculated from DCP)
      // Club1: Distinguished (5 goals + 20 members)
      // Club2: Select (7 goals + net growth 5)
      // Club3: Presidents (9 goals + 20 members)
      // Club4: Not distinguished (only 4 goals)
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(3)
      expect(result[0].areas[0].distinguishedClubs).toBe(3)
    })

    /**
     * Test with clubs that have CSP not submitted (not counted as distinguished)
     * Requirements: 3.5
     */
    it('should not count clubs as distinguished when CSP is not submitted', () => {
      // Arrange: Clubs with qualifying DCP but CSP not submitted
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Club Distinguished Status': 'Smedley Distinguished',
            'Goals Met': '10',
            'Active Members': '25',
            CSP: 'Yes', // CSP submitted - should count
          },
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Club Distinguished Status': 'Presidents Distinguished',
            'Goals Met': '9',
            'Active Members': '20',
            CSP: 'No', // CSP NOT submitted - should NOT count
          },
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Goals Met': '7',
            'Active Members': '20',
            'Mem. Base': '18',
            CSP: 'Yes', // CSP submitted - should count (Select from DCP)
          },
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Goals Met': '5',
            'Active Members': '20',
            'Mem. Base': '18',
            CSP: '0', // CSP NOT submitted (0 = false) - should NOT count
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should count only 2 distinguished (those with CSP submitted)
      // Club1: Smedley (CSP submitted)
      // Club2: NOT counted (CSP not submitted)
      // Club3: Select (CSP submitted)
      // Club4: NOT counted (CSP not submitted)
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(2)
      expect(result[0].areas[0].distinguishedClubs).toBe(2)
    })

    /**
     * Test division with all distinguished levels represented
     * Requirements: 3.1, 3.4
     */
    it('should count all distinguished levels correctly in division', () => {
      // Arrange: Division with one club at each distinguished level
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'F',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club1',
            'Club Distinguished Status': 'Distinguished',
          },
          {
            Division: 'F',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club2',
            'Club Distinguished Status': 'Select Distinguished',
          },
          {
            Division: 'F',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club3',
            'Club Distinguished Status': 'Presidents Distinguished',
          },
          {
            Division: 'F',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club4',
            'Club Distinguished Status': 'Smedley Distinguished',
          },
          {
            Division: 'F',
            Area: '02',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club5',
            'Club Distinguished Status': '', // Not distinguished
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Division should have 4 distinguished clubs (all levels count)
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(4)
      // Area 01 has 2 distinguished, Area 02 has 2 distinguished
      expect(result[0].areas[0].distinguishedClubs).toBe(2)
      expect(result[0].areas[1].distinguishedClubs).toBe(2)
    })

    /**
     * Test multiple divisions with different distinguished counts
     * Requirements: 3.1, 3.4
     */
    it('should correctly count distinguished clubs across multiple divisions', () => {
      // Arrange: Multiple divisions with different distinguished counts
      const snapshot = {
        divisionPerformance: [
          // Division A: 2 distinguished
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Club Distinguished Status': 'Distinguished',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Club Distinguished Status': 'Select Distinguished',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            'Club Distinguished Status': '',
          },
          // Division B: 1 distinguished
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '2',
            'Area Club Base': '2',
            Club: 'Club4',
            'Club Distinguished Status': 'Presidents Distinguished',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '2',
            'Area Club Base': '2',
            Club: 'Club5',
            'Club Distinguished Status': 'none',
          },
          // Division C: 0 distinguished
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '2',
            'Area Club Base': '2',
            Club: 'Club6',
            'Club Distinguished Status': '',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '2',
            'Area Club Base': '2',
            Club: 'Club7',
            'Goals Met': '3', // Not enough for distinguished
            'Active Members': '15',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Each division should have correct distinguished count
      expect(result).toHaveLength(3)
      expect(result[0].divisionId).toBe('A')
      expect(result[0].distinguishedClubs).toBe(2)
      expect(result[1].divisionId).toBe('B')
      expect(result[1].distinguishedClubs).toBe(1)
      expect(result[2].divisionId).toBe('C')
      expect(result[2].distinguishedClubs).toBe(0)
    })

    /**
     * Test area with no distinguished clubs
     * Requirements: 3.1, 3.4
     */
    it('should return 0 distinguished clubs when no clubs qualify', () => {
      // Arrange: Area with no distinguished clubs
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Club Distinguished Status': '',
            'Goals Met': '3',
            'Active Members': '15',
          },
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Club Distinguished Status': 'none',
            'Goals Met': '4',
            'Active Members': '18',
          },
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            'Club Distinguished Status': 'n/a',
            'Goals Met': '2',
            'Active Members': '12',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Division and area should have 0 distinguished clubs
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(0)
      expect(result[0].areas[0].distinguishedClubs).toBe(0)
    })

    /**
     * Test historical data without CSP field (should allow distinguished)
     * Requirements: 3.5
     */
    it('should count distinguished clubs when CSP field is absent (historical data)', () => {
      // Arrange: Clubs without CSP field (pre-2025-2026 data)
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'H',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Club Distinguished Status': 'Distinguished',
            // No CSP field - historical data
          },
          {
            Division: 'H',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Goals Met': '9',
            'Active Members': '20',
            'Mem. Base': '18',
            // No CSP field - historical data
          },
          {
            Division: 'H',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            'Club Distinguished Status': '',
            'Goals Met': '3',
            'Active Members': '15',
            // No CSP field - historical data
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Should count 2 distinguished (CSP field absence = historical data = allowed)
      // Club1: Distinguished (from status)
      // Club2: Presidents (calculated from DCP)
      // Club3: Not distinguished
      expect(result).toHaveLength(1)
      expect(result[0].distinguishedClubs).toBe(2)
      expect(result[0].areas[0].distinguishedClubs).toBe(2)
    })
  })

  /**
   * Tests for Visit counting integration
   * Verifies that visit counting works correctly when extracting division/area performance
   * Requirements: 4.2, 4.4, 4.5, 5.2, 5.4, 5.5
   */
  describe('Visit counting integration', () => {
    /**
     * Test area with all visits completed
     * All clubs have "1" in both visit fields
     * Requirements: 4.2, 4.5, 5.2, 5.5
     */
    it('should count all visits when all clubs have "1" in visit fields', () => {
      // Arrange: Area with 4 clubs, all with completed visits in both rounds
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Both rounds should have completed count equal to club count (4)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.clubBase).toBe(4)
      expect(area.firstRoundVisits.completed).toBe(4)
      expect(area.firstRoundVisits.percentage).toBe(100)
      expect(area.firstRoundVisits.meetsThreshold).toBe(true)
      expect(area.secondRoundVisits.completed).toBe(4)
      expect(area.secondRoundVisits.percentage).toBe(100)
      expect(area.secondRoundVisits.meetsThreshold).toBe(true)
    })

    /**
     * Test area with no visits completed
     * All clubs have "0" or missing visit fields
     * Requirements: 4.4, 5.4
     */
    it('should count 0 visits when all clubs have "0" or missing visit fields', () => {
      // Arrange: Area with 3 clubs, none with completed visits
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
          {
            Division: 'B',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            // Missing visit fields - should be treated as 0
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Both rounds should have 0 completed visits
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.clubBase).toBe(3)
      expect(area.firstRoundVisits.completed).toBe(0)
      expect(area.firstRoundVisits.percentage).toBe(0)
      expect(area.firstRoundVisits.meetsThreshold).toBe(false)
      expect(area.secondRoundVisits.completed).toBe(0)
      expect(area.secondRoundVisits.percentage).toBe(0)
      expect(area.secondRoundVisits.meetsThreshold).toBe(false)
    })

    /**
     * Test area with partial visits
     * Some clubs have "1", some have "0"
     * Requirements: 4.2, 4.4, 5.2, 5.4
     */
    it('should correctly count partial visits when some clubs have "1" and some have "0"', () => {
      // Arrange: Area with 5 clubs, 3 with first round visits, 2 with second round visits
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May visit award': '0',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club3',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club4',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'C',
            Area: '01',
            'Division Club Base': '5',
            'Area Club Base': '5',
            Club: 'Club5',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: First round = 3 completed, Second round = 2 completed
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.clubBase).toBe(5)
      // First round: 3 out of 5 = 60%
      expect(area.firstRoundVisits.completed).toBe(3)
      expect(area.firstRoundVisits.percentage).toBe(60)
      // 75% threshold for 5 clubs = 4 required, so 3 does not meet threshold
      expect(area.firstRoundVisits.meetsThreshold).toBe(false)
      // Second round: 2 out of 5 = 40%
      expect(area.secondRoundVisits.completed).toBe(2)
      expect(area.secondRoundVisits.percentage).toBe(40)
      expect(area.secondRoundVisits.meetsThreshold).toBe(false)
    })

    /**
     * Test area with mixed first/second round completion
     * Some clubs visited in first round only, some in second only
     * Requirements: 4.2, 4.4, 4.5, 5.2, 5.4, 5.5
     */
    it('should correctly count visits when clubs have different completion patterns', () => {
      // Arrange: Area with 4 clubs with different visit patterns
      // Club1: Both rounds completed
      // Club2: First round only
      // Club3: Second round only
      // Club4: Neither round
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May visit award': '0',
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Nov Visit award': '0',
            'May visit award': '1',
          },
          {
            Division: 'D',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: First round = 2 (Club1, Club2), Second round = 2 (Club1, Club3)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.clubBase).toBe(4)
      // First round: 2 out of 4 = 50%
      expect(area.firstRoundVisits.completed).toBe(2)
      expect(area.firstRoundVisits.percentage).toBe(50)
      // 75% threshold for 4 clubs = 3 required, so 2 does not meet threshold
      expect(area.firstRoundVisits.meetsThreshold).toBe(false)
      // Second round: 2 out of 4 = 50%
      expect(area.secondRoundVisits.completed).toBe(2)
      expect(area.secondRoundVisits.percentage).toBe(50)
      expect(area.secondRoundVisits.meetsThreshold).toBe(false)
    })

    /**
     * Test multiple areas with different visit completion rates
     * Verifies visit counting is isolated per area
     * Requirements: 4.2, 4.5, 5.2, 5.5
     */
    it('should correctly count visits for multiple areas independently', () => {
      // Arrange: Division with 2 areas, different visit completion rates
      const snapshot = {
        divisionPerformance: [
          // Area 01: 3 clubs, all visits completed
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'E',
            Area: '01',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club3',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          // Area 02: 3 clubs, no visits completed
          {
            Division: 'E',
            Area: '02',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club4',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
          {
            Division: 'E',
            Area: '02',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club5',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
          {
            Division: 'E',
            Area: '02',
            'Division Club Base': '6',
            'Area Club Base': '3',
            Club: 'Club6',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Area 01 has all visits, Area 02 has none
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(2)

      // Area 01: All visits completed
      const area01 = result[0].areas[0]
      expect(area01.areaId).toBe('01')
      expect(area01.firstRoundVisits.completed).toBe(3)
      expect(area01.firstRoundVisits.percentage).toBe(100)
      expect(area01.firstRoundVisits.meetsThreshold).toBe(true)
      expect(area01.secondRoundVisits.completed).toBe(3)
      expect(area01.secondRoundVisits.percentage).toBe(100)
      expect(area01.secondRoundVisits.meetsThreshold).toBe(true)

      // Area 02: No visits completed
      const area02 = result[0].areas[1]
      expect(area02.areaId).toBe('02')
      expect(area02.firstRoundVisits.completed).toBe(0)
      expect(area02.firstRoundVisits.percentage).toBe(0)
      expect(area02.firstRoundVisits.meetsThreshold).toBe(false)
      expect(area02.secondRoundVisits.completed).toBe(0)
      expect(area02.secondRoundVisits.percentage).toBe(0)
      expect(area02.secondRoundVisits.meetsThreshold).toBe(false)
    })

    /**
     * Test visit counting with numeric values (not just strings)
     * Requirements: 4.2, 5.2
     */
    it('should handle numeric visit values (1 instead of "1")', () => {
      // Arrange: Area with numeric visit values
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'F',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club1',
            'Nov Visit award': 1, // Numeric 1
            'May visit award': 1, // Numeric 1
          },
          {
            Division: 'F',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club2',
            'Nov Visit award': 0, // Numeric 0
            'May visit award': 1, // Numeric 1
          },
          {
            Division: 'F',
            Area: '01',
            'Division Club Base': '3',
            'Area Club Base': '3',
            Club: 'Club3',
            'Nov Visit award': 1, // Numeric 1
            'May visit award': 0, // Numeric 0
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: Numeric values should be counted correctly
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      // First round: 2 (Club1, Club3)
      expect(area.firstRoundVisits.completed).toBe(2)
      // Second round: 2 (Club1, Club2)
      expect(area.secondRoundVisits.completed).toBe(2)
    })

    /**
     * Test visit counting affects area qualification status
     * Requirements: 4.5, 5.5
     */
    it('should correctly determine area qualification based on visit counts', () => {
      // Arrange: Area with 4 clubs, 3 first round visits (75%), 3 second round visits (75%)
      // 75% threshold for 4 clubs = 3 required, so this should meet threshold
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Nov Visit award': '1',
            'May visit award': '1',
          },
          {
            Division: 'G',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Nov Visit award': '0',
            'May visit award': '0',
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: 3 out of 4 = 75%, meets threshold
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.firstRoundVisits.completed).toBe(3)
      expect(area.firstRoundVisits.required).toBe(3) // 75% of 4 = 3
      expect(area.firstRoundVisits.percentage).toBe(75)
      expect(area.firstRoundVisits.meetsThreshold).toBe(true)
      expect(area.secondRoundVisits.completed).toBe(3)
      expect(area.secondRoundVisits.required).toBe(3)
      expect(area.secondRoundVisits.percentage).toBe(75)
      expect(area.secondRoundVisits.meetsThreshold).toBe(true)
    })
  })

  /**
   * Tests for error handling behavior
   * Requirements: 6.2, 6.3
   *
   * These tests verify that the extraction function handles malformed,
   * missing, and invalid data gracefully without throwing exceptions.
   */
  describe('Error handling', () => {
    /**
     * Test with malformed district snapshot (not an object)
     * Requirements: 6.2
     */
    describe('malformed district snapshot', () => {
      it('should return empty array for string snapshot (no throw)', () => {
        // Arrange: Malformed snapshot - string instead of object
        const snapshot = 'not an object'

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array, not throw
        expect(result).toEqual([])
      })

      it('should return empty array for number snapshot (no throw)', () => {
        // Arrange: Malformed snapshot - number instead of object
        const snapshot = 12345

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array, not throw
        expect(result).toEqual([])
      })

      it('should return empty array for array snapshot (no throw)', () => {
        // Arrange: Malformed snapshot - array instead of object
        const snapshot = [1, 2, 3]

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array, not throw
        expect(result).toEqual([])
      })

      it('should return empty array for boolean snapshot (no throw)', () => {
        // Arrange: Malformed snapshot - boolean instead of object
        const snapshot = true

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array, not throw
        expect(result).toEqual([])
      })

      it('should return empty array for function snapshot (no throw)', () => {
        // Arrange: Malformed snapshot - function instead of object
        const snapshot = () => ({ divisionPerformance: [] })

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array, not throw
        expect(result).toEqual([])
      })
    })

    /**
     * Test with missing required fields
     * Requirements: 6.2, 6.3
     */
    describe('missing required fields', () => {
      it('should return empty array when divisionPerformance field is missing', () => {
        // Arrange: Snapshot without divisionPerformance field
        const snapshot = {
          clubPerformance: [],
          otherField: 'value',
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array
        expect(result).toEqual([])
      })

      it('should still extract divisions when clubPerformance field is missing', () => {
        // Arrange: Snapshot with divisionPerformance but no clubPerformance
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              'Division Club Base': '5',
              Club: 'Club1',
            },
          ],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should extract division with defaults for missing club performance data
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('A')
        expect(result[0].clubBase).toBe(5)
        expect(result[0].paidClubs).toBe(0) // No club performance data to count
      })

      it('should skip clubs with missing Division field', () => {
        // Arrange: Snapshot with clubs missing Division field
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              'Division Club Base': '3',
              Club: 'Club1',
            },
            {
              // Missing Division field
              'Division Club Base': '3',
              Club: 'Club2',
            },
            {
              Division: 'A',
              'Division Club Base': '3',
              Club: 'Club3',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should only include clubs with Division field
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('A')
        // Club base comes from field, not count
        expect(result[0].clubBase).toBe(3)
      })

      it('should handle empty divisionPerformance array', () => {
        // Arrange: Snapshot with empty divisionPerformance array
        const snapshot = {
          divisionPerformance: [],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array
        expect(result).toEqual([])
      })
    })

    /**
     * Test with invalid data types in fields
     * Requirements: 6.2, 6.3
     */
    describe('invalid data types in fields', () => {
      it('should handle object instead of string for Division field', () => {
        // Arrange: Snapshot with object instead of string for Division
        const snapshot = {
          divisionPerformance: [
            {
              Division: { name: 'A' }, // Object instead of string
              'Division Club Base': '5',
              Club: 'Club1',
            },
            {
              Division: 'B',
              'Division Club Base': '3',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should skip invalid Division and process valid one
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('B')
      })

      it('should handle array instead of string for Division field', () => {
        // Arrange: Snapshot with array instead of string for Division
        const snapshot = {
          divisionPerformance: [
            {
              Division: ['A', 'B'], // Array instead of string
              'Division Club Base': '5',
              Club: 'Club1',
            },
            {
              Division: 'C',
              'Division Club Base': '4',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should skip invalid Division and process valid one
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('C')
      })

      it('should handle null values in club records gracefully', () => {
        // Arrange: Snapshot with null values in various fields
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              'Division Club Base': null,
              'Area Club Base': null,
              Area: '01',
              Club: 'Club1',
              'Nov Visit award': null,
              'May visit award': null,
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should use fallback values
        expect(result).toHaveLength(1)
        expect(result[0].clubBase).toBe(1) // Falls back to counting clubs
        expect(result[0].areas).toHaveLength(1)
        expect(result[0].areas[0].clubBase).toBe(1) // Falls back to counting clubs
        expect(result[0].areas[0].firstRoundVisits.completed).toBe(0)
        expect(result[0].areas[0].secondRoundVisits.completed).toBe(0)
      })

      it('should handle non-array divisionPerformance field', () => {
        // Arrange: Snapshot with object instead of array for divisionPerformance
        const snapshot = {
          divisionPerformance: { Division: 'A' }, // Object instead of array
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should return empty array
        expect(result).toEqual([])
      })

      it('should handle non-object entries in divisionPerformance array', () => {
        // Arrange: Snapshot with non-object entries in array
        const snapshot = {
          divisionPerformance: [
            'invalid string entry',
            123,
            null,
            {
              Division: 'A',
              'Division Club Base': '5',
              Club: 'Club1',
            },
            undefined,
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should skip invalid entries and process valid one
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('A')
      })
    })

    /**
     * Test with empty strings in required fields
     * Requirements: 6.3
     */
    describe('empty strings in required fields', () => {
      it('should skip clubs with empty string Division field', () => {
        // Arrange: Snapshot with empty string Division
        const snapshot = {
          divisionPerformance: [
            {
              Division: '', // Empty string
              'Division Club Base': '5',
              Club: 'Club1',
            },
            {
              Division: 'A',
              'Division Club Base': '3',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should skip empty Division and process valid one
        expect(result).toHaveLength(1)
        expect(result[0].divisionId).toBe('A')
      })

      it('should use fallback for empty string Division Club Base', () => {
        // Arrange: Snapshot with empty string Division Club Base
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              'Division Club Base': '', // Empty string
              Club: 'Club1',
            },
            {
              Division: 'A',
              'Division Club Base': '',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should fall back to counting clubs (2)
        expect(result).toHaveLength(1)
        expect(result[0].clubBase).toBe(2)
      })

      it('should skip areas with empty string Area field', () => {
        // Arrange: Snapshot with empty string Area
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              Area: '', // Empty string
              'Division Club Base': '3',
              Club: 'Club1',
            },
            {
              Division: 'A',
              Area: '01',
              'Division Club Base': '3',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should only include area with valid Area field
        expect(result).toHaveLength(1)
        expect(result[0].areas).toHaveLength(1)
        expect(result[0].areas[0].areaId).toBe('01')
      })

      it('should use fallback for empty string Area Club Base', () => {
        // Arrange: Snapshot with empty string Area Club Base
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              Area: '01',
              'Division Club Base': '4',
              'Area Club Base': '', // Empty string
              Club: 'Club1',
            },
            {
              Division: 'A',
              Area: '01',
              'Division Club Base': '4',
              'Area Club Base': '',
              Club: 'Club2',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Should fall back to counting clubs in area (2)
        expect(result).toHaveLength(1)
        expect(result[0].areas).toHaveLength(1)
        expect(result[0].areas[0].clubBase).toBe(2)
      })

      it('should treat empty string visit awards as not completed', () => {
        // Arrange: Snapshot with empty string visit awards
        const snapshot = {
          divisionPerformance: [
            {
              Division: 'A',
              Area: '01',
              'Division Club Base': '3',
              'Area Club Base': '3',
              Club: 'Club1',
              'Nov Visit award': '', // Empty string
              'May visit award': '', // Empty string
            },
            {
              Division: 'A',
              Area: '01',
              'Division Club Base': '3',
              'Area Club Base': '3',
              Club: 'Club2',
              'Nov Visit award': '1',
              'May visit award': '',
            },
          ],
          clubPerformance: [],
        }

        // Act: Extract division performance
        const result = extractDivisionPerformance(snapshot)

        // Assert: Only Club2 has first round visit completed
        expect(result).toHaveLength(1)
        expect(result[0].areas).toHaveLength(1)
        expect(result[0].areas[0].firstRoundVisits.completed).toBe(1)
        expect(result[0].areas[0].secondRoundVisits.completed).toBe(0)
      })
    })
  })
})

describe('determineDistinguishedLevel', () => {
  /**
   * Tests for valid "Club Distinguished Status" field values
   * Requirements: 3.1, 3.2
   */
  describe('with valid "Club Distinguished Status" field', () => {
    it('should return "Distinguished" for "Distinguished" status', () => {
      // Arrange: Club with Distinguished status
      const club = {
        'Club Distinguished Status': 'Distinguished',
        'Goals Met': '5',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Distinguished')
    })

    it('should return "Select" for "Select Distinguished" status', () => {
      // Arrange: Club with Select Distinguished status
      const club = {
        'Club Distinguished Status': 'Select Distinguished',
        'Goals Met': '7',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Select')
    })

    it('should return "Presidents" for "Presidents Distinguished" status', () => {
      // Arrange: Club with Presidents Distinguished status
      const club = {
        'Club Distinguished Status': 'Presidents Distinguished',
        'Goals Met': '9',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Presidents')
    })

    it('should return "Smedley" for "Smedley Distinguished" status', () => {
      // Arrange: Club with Smedley Distinguished status
      const club = {
        'Club Distinguished Status': 'Smedley Distinguished',
        'Goals Met': '10',
        'Active Members': '25',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Smedley')
    })

    it('should handle case-insensitive status values', () => {
      // Arrange: Club with lowercase status
      const club = {
        'Club Distinguished Status': 'select distinguished',
        'Goals Met': '7',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Select')
    })

    it('should handle status with extra whitespace', () => {
      // Arrange: Club with whitespace in status
      const club = {
        'Club Distinguished Status': '  Presidents Distinguished  ',
        'Goals Met': '9',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Presidents')
    })
  })

  /**
   * Tests for missing status field with DCP calculation
   * Requirements: 3.3
   */
  describe('with missing status field (DCP calculation)', () => {
    it('should calculate Distinguished from 5 goals + 20 members', () => {
      // Arrange: Club with 5 goals and 20 members, no status field
      const club = {
        'Goals Met': '5',
        'Active Members': '20',
        'Mem. Base': '18',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Distinguished')
    })

    it('should calculate Distinguished from 5 goals + net growth of 3', () => {
      // Arrange: Club with 5 goals and net growth of 3 (but < 20 members)
      const club = {
        'Goals Met': '5',
        'Active Members': '18',
        'Mem. Base': '15', // Net growth = 18 - 15 = 3
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Distinguished')
    })

    it('should calculate Select from 7 goals + 20 members', () => {
      // Arrange: Club with 7 goals and 20 members
      const club = {
        'Goals Met': '7',
        'Active Members': '20',
        'Mem. Base': '18',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Select')
    })

    it('should calculate Select from 7 goals + net growth of 5', () => {
      // Arrange: Club with 7 goals and net growth of 5 (but < 20 members)
      const club = {
        'Goals Met': '7',
        'Active Members': '19',
        'Mem. Base': '14', // Net growth = 19 - 14 = 5
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Select')
    })

    it('should calculate Presidents from 9 goals + 20 members', () => {
      // Arrange: Club with 9 goals and 20 members
      const club = {
        'Goals Met': '9',
        'Active Members': '20',
        'Mem. Base': '18',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Presidents')
    })

    it('should calculate Smedley from 10 goals + 25 members', () => {
      // Arrange: Club with 10 goals and 25 members
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Smedley')
    })

    it('should return null when goals are insufficient', () => {
      // Arrange: Club with only 4 goals (below Distinguished threshold)
      const club = {
        'Goals Met': '4',
        'Active Members': '25',
        'Mem. Base': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBeNull()
    })

    it('should return null when membership and net growth are insufficient', () => {
      // Arrange: Club with 5 goals but < 20 members and < 3 net growth
      const club = {
        'Goals Met': '5',
        'Active Members': '18',
        'Mem. Base': '17', // Net growth = 18 - 17 = 1
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBeNull()
    })
  })

  /**
   * Tests for all distinguished levels boundary conditions
   * Requirements: 3.1, 3.2, 3.3, 3.4
   */
  describe('distinguished level boundary conditions', () => {
    it('should return Distinguished at exactly 5 goals + 20 members', () => {
      const club = {
        'Goals Met': '5',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Distinguished')
    })

    it('should return null at 4 goals + 20 members', () => {
      const club = {
        'Goals Met': '4',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBeNull()
    })

    it('should return null at 5 goals + 19 members + 2 net growth', () => {
      const club = {
        'Goals Met': '5',
        'Active Members': '19',
        'Mem. Base': '17', // Net growth = 2
      }
      expect(determineDistinguishedLevel(club)).toBeNull()
    })

    it('should return Select at exactly 7 goals + 20 members', () => {
      const club = {
        'Goals Met': '7',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Select')
    })

    it('should return Distinguished at 6 goals + 20 members (not Select)', () => {
      const club = {
        'Goals Met': '6',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Distinguished')
    })

    it('should return Presidents at exactly 9 goals + 20 members', () => {
      const club = {
        'Goals Met': '9',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Presidents')
    })

    it('should return Select at 8 goals + 20 members (not Presidents)', () => {
      const club = {
        'Goals Met': '8',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Select')
    })

    it('should return Smedley at exactly 10 goals + 25 members', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should return Presidents at 10 goals + 24 members (not Smedley)', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '24',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Presidents')
    })

    it('should return Presidents at 10 goals + 20 members (not Smedley)', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '20',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Presidents')
    })
  })

  /**
   * Tests for CSP requirement behavior
   * Requirements: 3.5
   */
  describe('CSP requirement behavior', () => {
    it('should return null when CSP is not submitted', () => {
      // Arrange: Club with qualifying DCP but CSP not submitted
      const club = {
        'Club Distinguished Status': 'Distinguished',
        'Goals Met': '10',
        'Active Members': '25',
        CSP: 'No',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert: Should return null because CSP is required
      expect(result).toBeNull()
    })

    it('should return distinguished level when CSP is submitted', () => {
      // Arrange: Club with qualifying DCP and CSP submitted
      const club = {
        'Club Distinguished Status': 'Smedley Distinguished',
        'Goals Met': '10',
        'Active Members': '25',
        CSP: 'Yes',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert
      expect(result).toBe('Smedley')
    })

    it('should allow distinguished status when CSP field is absent (historical data)', () => {
      // Arrange: Club without CSP field (pre-2025-2026 data)
      const club = {
        'Club Distinguished Status': 'Presidents Distinguished',
        'Goals Met': '9',
        'Active Members': '20',
      }

      // Act
      const result = determineDistinguishedLevel(club)

      // Assert: Should return status because CSP field is absent
      expect(result).toBe('Presidents')
    })

    it('should handle CSP value "true" as submitted', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        CSP: 'true',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should handle CSP value "false" as not submitted', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        CSP: 'false',
      }
      expect(determineDistinguishedLevel(club)).toBeNull()
    })

    it('should handle CSP value "1" as submitted', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        CSP: '1',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should handle CSP value "0" as not submitted', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        CSP: '0',
      }
      expect(determineDistinguishedLevel(club)).toBeNull()
    })

    it('should handle "Club Success Plan" field name', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        'Club Success Plan': 'Yes',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should handle "CSP Submitted" field name', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
        'CSP Submitted': 'Yes',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })
  })

  /**
   * Tests for edge cases with empty/invalid status values
   * Requirements: 3.2, 3.3
   */
  describe('edge cases for status field values', () => {
    it('should calculate from DCP when status is empty string', () => {
      const club = {
        'Club Distinguished Status': '',
        'Goals Met': '7',
        'Active Members': '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Select')
    })

    it('should calculate from DCP when status is "none"', () => {
      const club = {
        'Club Distinguished Status': 'none',
        'Goals Met': '9',
        'Active Members': '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Presidents')
    })

    it('should calculate from DCP when status is "n/a"', () => {
      const club = {
        'Club Distinguished Status': 'n/a',
        'Goals Met': '5',
        'Active Members': '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Distinguished')
    })

    it('should calculate from DCP when status is null', () => {
      const club = {
        'Club Distinguished Status': null,
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should calculate from DCP when status is undefined', () => {
      const club = {
        'Club Distinguished Status': undefined,
        'Goals Met': '7',
        'Active Members': '19',
        'Mem. Base': '14', // Net growth = 5
      }
      expect(determineDistinguishedLevel(club)).toBe('Select')
    })

    it('should handle unrecognized status value by calculating from DCP', () => {
      const club = {
        'Club Distinguished Status': 'Unknown Status',
        'Goals Met': '5',
        'Active Members': '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Distinguished')
    })
  })

  /**
   * Tests for alternative membership field names
   * Requirements: 3.3
   */
  describe('alternative membership field names', () => {
    it('should use "Active Membership" field', () => {
      const club = {
        'Goals Met': '10',
        'Active Membership': '25',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should use "Membership" field', () => {
      const club = {
        'Goals Met': '9',
        Membership: '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Presidents')
    })

    it('should use "Paid Members" field', () => {
      const club = {
        'Goals Met': '7',
        'Paid Members': '20',
        'Mem. Base': '18',
      }
      expect(determineDistinguishedLevel(club)).toBe('Select')
    })

    it('should use "Base" field for membership base', () => {
      const club = {
        'Goals Met': '5',
        'Active Members': '18',
        Base: '15', // Net growth = 3
      }
      expect(determineDistinguishedLevel(club)).toBe('Distinguished')
    })
  })

  /**
   * Tests for numeric vs string field values
   * Requirements: 3.3
   */
  describe('numeric vs string field values', () => {
    it('should handle numeric Goals Met value', () => {
      const club = {
        'Goals Met': 10,
        'Active Members': 25,
        'Mem. Base': 20,
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should handle string Goals Met value', () => {
      const club = {
        'Goals Met': '10',
        'Active Members': '25',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBe('Smedley')
    })

    it('should handle missing Goals Met field', () => {
      const club = {
        'Active Members': '25',
        'Mem. Base': '20',
      }
      expect(determineDistinguishedLevel(club)).toBeNull()
    })

    it('should handle missing membership fields', () => {
      const club = {
        'Goals Met': '10',
        'Mem. Base': '20',
      }
      // With 0 members and 0 - 20 = -20 net growth, should not qualify
      expect(determineDistinguishedLevel(club)).toBeNull()
    })
  })
})

describe('countVisitCompletions', () => {
  /**
   * Tests for counting clubs with "1" in visit field
   * Requirements: 4.2, 5.2
   */
  describe('basic counting behavior', () => {
    it('should count all clubs when all have "1" in visit field', () => {
      // Arrange: All clubs have completed visits
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '1', Club: 'Club B' },
        { 'Nov Visit award': '1', Club: 'Club C' },
        { 'Nov Visit award': '1', Club: 'Club D' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert
      expect(result).toBe(4)
    })

    it('should return 0 when no clubs have "1" in visit field', () => {
      // Arrange: No clubs have completed visits
      const clubs = [
        { 'Nov Visit award': '0', Club: 'Club A' },
        { 'Nov Visit award': '0', Club: 'Club B' },
        { 'Nov Visit award': '0', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert
      expect(result).toBe(0)
    })

    it('should count only clubs with "1" when values are mixed', () => {
      // Arrange: Mixed visit completion values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '0', Club: 'Club B' },
        { 'Nov Visit award': '1', Club: 'Club C' },
        { 'Nov Visit award': '0', Club: 'Club D' },
        { 'Nov Visit award': '1', Club: 'Club E' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 3 clubs have "1"
      expect(result).toBe(3)
    })

    it('should work with "May visit award" field', () => {
      // Arrange: Clubs with May visit data
      const clubs = [
        { 'May visit award': '1', Club: 'Club A' },
        { 'May visit award': '0', Club: 'Club B' },
        { 'May visit award': '1', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'May visit award')

      // Assert
      expect(result).toBe(2)
    })
  })

  /**
   * Tests for handling missing fields
   * Requirements: 4.4, 5.4
   */
  describe('handling missing fields', () => {
    it('should not count clubs with missing visit field', () => {
      // Arrange: Some clubs missing the visit field
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { Club: 'Club B' }, // Missing field
        { 'Nov Visit award': '1', Club: 'Club C' },
        { Club: 'Club D' }, // Missing field
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 2 clubs have "1"
      expect(result).toBe(2)
    })

    it('should return 0 when all clubs are missing the visit field', () => {
      // Arrange: All clubs missing the visit field
      const clubs = [
        { Club: 'Club A', Division: 'A' },
        { Club: 'Club B', Division: 'A' },
        { Club: 'Club C', Division: 'A' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert
      expect(result).toBe(0)
    })

    it('should return 0 for empty clubs array', () => {
      // Arrange: Empty array
      const clubs: unknown[] = []

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert
      expect(result).toBe(0)
    })
  })

  /**
   * Tests for handling empty and "0" values
   * Requirements: 4.4, 5.4
   */
  describe('handling empty and "0" values', () => {
    it('should not count clubs with empty string value', () => {
      // Arrange: Clubs with empty string values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '', Club: 'Club B' },
        { 'Nov Visit award': '1', Club: 'Club C' },
        { 'Nov Visit award': '', Club: 'Club D' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 2 clubs have "1"
      expect(result).toBe(2)
    })

    it('should not count clubs with "0" value', () => {
      // Arrange: Clubs with "0" values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '0', Club: 'Club B' },
        { 'Nov Visit award': '0', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 1 club has "1"
      expect(result).toBe(1)
    })

    it('should not count clubs with null value', () => {
      // Arrange: Clubs with null values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': null, Club: 'Club B' },
        { 'Nov Visit award': '1', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 2 clubs have "1"
      expect(result).toBe(2)
    })

    it('should not count clubs with undefined value', () => {
      // Arrange: Clubs with undefined values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': undefined, Club: 'Club B' },
        { 'Nov Visit award': '1', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only 2 clubs have "1"
      expect(result).toBe(2)
    })
  })

  /**
   * Tests for handling invalid data types
   * Requirements: 4.2, 5.2
   */
  describe('handling invalid data types', () => {
    it('should handle numeric 1 value (not just string "1")', () => {
      // Arrange: Clubs with numeric values
      const clubs = [
        { 'Nov Visit award': 1, Club: 'Club A' },
        { 'Nov Visit award': 0, Club: 'Club B' },
        { 'Nov Visit award': 1, Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Numeric 1 should also be counted
      expect(result).toBe(2)
    })

    it('should not count invalid string values', () => {
      // Arrange: Clubs with invalid string values
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': 'yes', Club: 'Club B' },
        { 'Nov Visit award': 'true', Club: 'Club C' },
        { 'Nov Visit award': '2', Club: 'Club D' },
      ]

      // Act
      const result = countVisitCompletions(clubs, 'Nov Visit award')

      // Assert: Only "1" is counted, not "yes", "true", or "2"
      expect(result).toBe(1)
    })

    it('should skip non-object entries in clubs array', () => {
      // Arrange: Array with non-object entries
      const clubs = [
        { 'Nov Visit award': '1', Club: 'Club A' },
        null,
        { 'Nov Visit award': '1', Club: 'Club B' },
        undefined,
        'invalid',
        123,
        { 'Nov Visit award': '1', Club: 'Club C' },
      ]

      // Act
      const result = countVisitCompletions(
        clubs as unknown[],
        'Nov Visit award'
      )

      // Assert: Only valid objects with "1" are counted
      expect(result).toBe(3)
    })
  })

  /**
   * Tests for real-world scenarios
   * Requirements: 4.2, 4.4, 5.2, 5.4
   */
  describe('real-world scenarios', () => {
    it('should correctly count first round visits for a typical area', () => {
      // Arrange: Typical area with 5 clubs, 3 visited
      const clubs = [
        {
          'Nov Visit award': '1',
          'May visit award': '0',
          Club: 'Club A',
          Area: 'A1',
        },
        {
          'Nov Visit award': '1',
          'May visit award': '1',
          Club: 'Club B',
          Area: 'A1',
        },
        {
          'Nov Visit award': '0',
          'May visit award': '0',
          Club: 'Club C',
          Area: 'A1',
        },
        {
          'Nov Visit award': '1',
          'May visit award': '1',
          Club: 'Club D',
          Area: 'A1',
        },
        {
          'Nov Visit award': '0',
          'May visit award': '0',
          Club: 'Club E',
          Area: 'A1',
        },
      ]

      // Act
      const firstRound = countVisitCompletions(clubs, 'Nov Visit award')
      const secondRound = countVisitCompletions(clubs, 'May visit award')

      // Assert
      expect(firstRound).toBe(3)
      expect(secondRound).toBe(2)
    })

    it('should handle area with all visits completed', () => {
      // Arrange: Area with all visits completed
      const clubs = [
        { 'Nov Visit award': '1', 'May visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '1', 'May visit award': '1', Club: 'Club B' },
        { 'Nov Visit award': '1', 'May visit award': '1', Club: 'Club C' },
      ]

      // Act
      const firstRound = countVisitCompletions(clubs, 'Nov Visit award')
      const secondRound = countVisitCompletions(clubs, 'May visit award')

      // Assert
      expect(firstRound).toBe(3)
      expect(secondRound).toBe(3)
    })

    it('should handle area with no visits completed', () => {
      // Arrange: Area with no visits completed
      const clubs = [
        { 'Nov Visit award': '0', 'May visit award': '0', Club: 'Club A' },
        { 'Nov Visit award': '0', 'May visit award': '0', Club: 'Club B' },
        { 'Nov Visit award': '0', 'May visit award': '0', Club: 'Club C' },
      ]

      // Act
      const firstRound = countVisitCompletions(clubs, 'Nov Visit award')
      const secondRound = countVisitCompletions(clubs, 'May visit award')

      // Assert
      expect(firstRound).toBe(0)
      expect(secondRound).toBe(0)
    })
  })

  /**
   * Bug #268: CDN data uses "May Visit award" (capital V in Visit)
   * but the code was looking for "May visit award" (lowercase v).
   * This caused all second-round visit counts to show as 0.
   *
   * The actual CDN field name is "May Visit award" — the extraction
   * must handle this capitalisation to match real-world data.
   */
  describe('CDN field name capitalisation — Bug #268', () => {
    it('should count second-round visits using CDN field name "May Visit award" (capital V)', () => {
      // Arrange: Club data using the actual CDN field name (capital V in Visit)
      const snapshot = {
        divisionPerformance: [
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club1',
            'Nov Visit award': '1',
            'May Visit award': '1', // CDN uses capital V
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club2',
            'Nov Visit award': '1',
            'May Visit award': '0', // CDN uses capital V
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club3',
            'Nov Visit award': '0',
            'May Visit award': '1', // CDN uses capital V
          },
          {
            Division: 'A',
            Area: '01',
            'Division Club Base': '4',
            'Area Club Base': '4',
            Club: 'Club4',
            'Nov Visit award': '1',
            'May Visit award': '0', // CDN uses capital V
          },
        ],
        clubPerformance: [],
      }

      // Act
      const result = extractDivisionPerformance(snapshot)

      // Assert: First round = 3 (Club1, Club2, Club4), Second round = 2 (Club1, Club3)
      expect(result).toHaveLength(1)
      expect(result[0].areas).toHaveLength(1)
      const area = result[0].areas[0]
      expect(area.firstRoundVisits.completed).toBe(3)
      expect(area.secondRoundVisits.completed).toBe(2) // This was 0 before the fix
    })

    it('should handle countVisitCompletions with CDN field name "May Visit award"', () => {
      // Arrange: Club data with actual CDN field names
      const clubs = [
        { 'Nov Visit award': '1', 'May Visit award': '1', Club: 'Club A' },
        { 'Nov Visit award': '0', 'May Visit award': '1', Club: 'Club B' },
        { 'Nov Visit award': '1', 'May Visit award': '0', Club: 'Club C' },
      ]

      // Act
      const secondRound = countVisitCompletions(clubs, 'May Visit award')

      // Assert: 2 clubs completed (Club A, Club B)
      expect(secondRound).toBe(2)
    })

    it('should handle extractVisitData with CDN field name "May Visit award"', () => {
      // Arrange: Area data with actual CDN field name
      const areaData = {
        'Nov Visit award': '3',
        'May Visit award': '4', // CDN uses capital V
      }
      const clubBase = 4

      // Act
      const result = extractVisitData(areaData, clubBase)

      // Assert
      expect(result.firstRound.completed).toBe(3)
      expect(result.secondRound.completed).toBe(4) // This was 0 before the fix
    })
  })
})

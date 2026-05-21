/**
 * Program Year Utilities
 * Toastmasters program year runs from July 1 to June 30
 */

export interface ProgramYear {
  year: number // The starting year (e.g., 2024 for 2024-2025 program year)
  startDate: string // YYYY-MM-DD format
  endDate: string // YYYY-MM-DD format
  label: string // Display label (e.g., "2024-2025")
}

/**
 * Get the current program year
 */
export function getCurrentProgramYear(): ProgramYear {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

  // If we're in July-December, the program year started this year
  // If we're in January-June, the program year started last year
  const programYearStart = currentMonth >= 7 ? currentYear : currentYear - 1

  return {
    year: programYearStart,
    startDate: `${programYearStart}-07-01`,
    endDate: `${programYearStart + 1}-06-30`,
    label: `${programYearStart}-${programYearStart + 1}`,
  }
}

/**
 * Get a specific program year by starting year
 */
export function getProgramYear(year: number): ProgramYear {
  return {
    year,
    startDate: `${year}-07-01`,
    endDate: `${year + 1}-06-30`,
    label: `${year}-${year + 1}`,
  }
}

/**
 * Get all available program years from a list of dates
 */
export function getAvailableProgramYears(dates: string[]): ProgramYear[] {
  if (dates.length === 0) return []

  const programYears = new Set<number>()

  dates.forEach(dateStr => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    // Determine which program year this date belongs to
    const programYearStart = month >= 7 ? year : year - 1
    programYears.add(programYearStart)
  })

  // Convert to array and sort in descending order (most recent first)
  const years = Array.from(programYears).sort((a, b) => b - a)

  return years.map(year => getProgramYear(year))
}

/**
 * Filter dates to only include those within a specific program year
 */
export function filterDatesByProgramYear(
  dates: string[],
  programYear: ProgramYear
): string[] {
  return dates.filter(dateStr => {
    return dateStr >= programYear.startDate && dateStr <= programYear.endDate
  })
}

/**
 * Get the program year that a specific date belongs to
 */
export function getProgramYearForDate(dateStr: string): ProgramYear {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  const programYearStart = month >= 7 ? year : year - 1
  return getProgramYear(programYearStart)
}

/**
 * Check if a date is within a program year
 */
export function isDateInProgramYear(
  dateStr: string,
  programYear: ProgramYear
): boolean {
  return dateStr >= programYear.startDate && dateStr <= programYear.endDate
}

/**
 * Get the most recent date within a program year from a list of dates
 */
export function getMostRecentDateInProgramYear(
  dates: string[],
  programYear: ProgramYear
): string | null {
  const filteredDates = filterDatesByProgramYear(dates, programYear)
  if (filteredDates.length === 0) return null

  // Sort in descending order and return the first (most recent)
  return filteredDates.sort((a, b) => b.localeCompare(a))[0] ?? null
}

/**
 * Format program year for display
 */
export function formatProgramYear(programYear: ProgramYear): string {
  return programYear.label
}

/**
 * Compact 2-digit-year program-year label ("2025-26").
 * Used by per-PY callouts (milestones, anniversaries) where the full
 * `formatProgramYear` 4-digit label ("2025-2026") is too wide.
 */
export function formatProgramYearShort(start: number): string {
  return `${start}-${(start + 1).toString().slice(-2)}`
}

/**
 * Get program year progress (0-100%)
 */
export function getProgramYearProgress(programYear: ProgramYear): number {
  const now = new Date()
  const start = new Date(programYear.startDate)
  const end = new Date(programYear.endDate)

  if (now < start) return 0
  if (now > end) return 100

  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.round((elapsed / total) * 100)
}

/**
 * Calculate the day number within a program year for a given date.
 * Program year starts July 1 (day 0) and ends June 30 (day 364 or 365 in leap years).
 *
 * @param dateStr - ISO date string (YYYY-MM-DD) or Date object
 * @returns Day number within the program year (0-365)
 *
 * Requirements: 2.2 - Align data by relative position within the program year
 */
export function calculateProgramYearDay(dateStr: string | Date): number {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr

  // Get the program year start date for this date
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed (0 = January, 6 = July)

  // Program year starts July 1
  // If month >= 6 (July or later), program year started this calendar year
  // If month < 6 (before July), program year started previous calendar year
  const programYearStartYear = month >= 6 ? year : year - 1
  const programYearStart = new Date(programYearStartYear, 6, 1) // July 1

  // Calculate days since program year start
  const diffTime = date.getTime() - programYearStart.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  // Clamp to valid range [0, 365]
  return Math.max(0, Math.min(365, diffDays))
}

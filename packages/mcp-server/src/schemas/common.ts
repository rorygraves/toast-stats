/** Matches a YYYY-MM-DD snapshot date — the single source for the date contract
 * shared by the read-schemas and the CdnClient pre-flight date guard. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Matches a YYYY-YYYY program-year identifier (e.g. "2025-2026"). */
export const PROGRAM_YEAR_RE = /^\d{4}-\d{4}$/

/**
 * Matches a Toastmasters district identifier: one or more alphanumerics
 * (e.g. "61", "F", "U"). The CdnClient uses this as a pre-flight guard so a
 * raw id can never inject a path segment (`../`, slashes) into a CDN URL. */
export const DISTRICT_ID_RE = /^[A-Za-z0-9]+$/

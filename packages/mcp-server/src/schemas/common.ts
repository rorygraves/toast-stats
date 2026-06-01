/** Matches a YYYY-MM-DD snapshot date — the single source for the date contract
 * shared by the read-schemas and the CdnClient pre-flight date guard. */
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

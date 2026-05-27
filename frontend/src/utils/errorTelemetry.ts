/**
 * Error Telemetry Utility (#225)
 *
 * Lightweight client-side error recording with localStorage persistence.
 * No PII — only technical context (message, stack, URL, user agent).
 * FIFO eviction at 50 entries.
 */

const STORAGE_KEY = 'toast-stats-error-telemetry'
const MAX_ENTRIES = 50

declare const __APP_VERSION__: string

export interface ErrorRecord {
  timestamp: string
  message: string
  componentStack?: string
  url: string
  userAgent: string
}

/**
 * Record an error to localStorage.
 * Silently no-ops if localStorage is unavailable.
 */
export function recordError(
  error: Error,
  componentStack?: string
): ErrorRecord | null {
  const record: ErrorRecord = {
    timestamp: new Date().toISOString(),
    message: error.message,
    ...(componentStack !== undefined && componentStack !== null
      ? { componentStack }
      : {}),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  }

  try {
    const existing = getStoredErrors()
    existing.push(record)

    // FIFO eviction — keep only the last MAX_ENTRIES
    const trimmed = existing.slice(-MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    return record
  } catch {
    // localStorage unavailable or full — silently ignore
    return null
  }
}

/**
 * Get all stored error records.
 */
export function getStoredErrors(): ErrorRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ErrorRecord[]
  } catch {
    return []
  }
}

/**
 * Get the count of stored errors.
 */
export function getErrorCount(): number {
  return getStoredErrors().length
}

/**
 * Clear all stored errors.
 */
export function clearErrors(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// --- Remote Reporting (#254) ---

/**
 * Wire format for remote error reports.
 * Contains ONLY technical context — no PII.
 */
export interface RemoteErrorReport {
  timestamp: string
  message: string
  componentStack?: string
  url: string
  userAgent: string
  appVersion: string
}

/**
 * Report an error to a remote telemetry endpoint.
 *
 * Gated by two env vars:
 *   - VITE_TELEMETRY_ENDPOINT: URL to POST to (required)
 *   - VITE_ENABLE_TELEMETRY: set to "false" to disable (optional)
 *
 * Fire-and-forget — silently swallows all errors to never
 * impact user experience.
 */
export async function reportErrorRemote(
  error: Error,
  componentStack?: string
): Promise<void> {
  try {
    const enableFlag = import.meta.env['VITE_ENABLE_TELEMETRY']
    if (enableFlag === 'false') return

    const endpoint = import.meta.env['VITE_TELEMETRY_ENDPOINT'] as
      | string
      | undefined
    if (!endpoint) return

    // CSP coupling (#783): this POST is a `connect-src` sink. The endpoint is
    // unset in every current pipeline, so it's dormant — but if remote
    // telemetry is ever wired up, its origin MUST be added to the
    // Content-Security-Policy `connect-src` in firebase.json, or the browser
    // will block the request (and the catch below will swallow the violation).

    const report: RemoteErrorReport = {
      timestamp: new Date().toISOString(),
      message: error.message,
      ...(componentStack !== undefined ? { componentStack } : {}),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      appVersion:
        typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
    }

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
  } catch {
    // Silently swallow — telemetry must never crash the app
  }
}

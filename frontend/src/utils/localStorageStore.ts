/* Versioned localStorage primitive (#420). All persistence — favorites,
   filters, last-visited, my-district pin — goes through this module so
   schema migrations stay tractable. Bump STORAGE_VERSION whenever the
   shape of any stored value changes incompatibly. */

export const STORAGE_VERSION = 1
const PREFIX = 'toast-stats'

export function storageKey(name: string): string {
  return `${PREFIX}:v${STORAGE_VERSION}:${name}`
}

export function readJson<T>(name: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(name))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(name: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(storageKey(name), JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(name: string): void {
  try {
    window.localStorage.removeItem(storageKey(name))
  } catch {
    // ignore — localStorage may be disabled
  }
}

/**
 * clubFilterUrl — round-trip the club table's FilterState through URL search
 * params (#817, epic #818 Sprint 4).
 *
 * Sprints 1–3 URL-synced only `status` and the name `search`; every other
 * column filter was in-session and lost on reload. This generalises the mapping
 * so every `filterable` column is shareable/bookmarkable. The two legacy params
 * keep their exact contract (so old links and the App.tsx `?tab=clubs` redirect
 * still resolve):
 *   - `name`   ⇄ `?search=<q>`            (text, contains)
 *   - `status` ⇄ `?status=<alias>`         (categorical, single, value-aliased)
 * Every other filterable column uses its bare field name as the param key:
 *   - text       ⇄ raw string                (e.g. `?division=A`)
 *   - numeric    ⇄ `min..max`, open end omitted (`?membersNeeded=2..`, `?m=..20`)
 *   - categorical⇄ comma-joined values        (`?distinguished=President,Select`)
 *
 * Reserved params (`py`, `date`, `sort`, `dir`) are never read or written here.
 */
import {
  COLUMN_CONFIGS,
  ColumnFilter,
  FilterState,
  SortField,
} from '../components/filters/types'

/** name is carried by `search`, not its own key. */
const SEARCH_PARAM = 'search'
const STATUS_PARAM = 'status'

/**
 * "Close to Distinguished" preset (#979). The preset is a separate pipeline
 * step layered on the column filters (R11), NOT a column filter — so it lives
 * here (the single club-URL contract module, no parallel param scheme) but is
 * deliberately kept OUT of FILTER_PARAM_KEYS: the page's wholesale filter
 * reconcile deletes every FILTER_PARAM_KEYS entry then re-emits present filters,
 * and `filterStateToParams` never emits `preset`, so including it would clear
 * the preset on any filter change. The preset gets its own single writer on the
 * page (the proven sort/dir pattern — disjoint key, no shared-batch trigger, so
 * no lesson-070 same-batch race). Only the canonical token activates it.
 */
export const PRESET_PARAM = 'preset'
export const PRESET_CLOSE_TO_DISTINGUISHED = 'close-to-distinguished'

/** Read whether the "Close to Distinguished" preset is active from the URL. */
export function paramsToPresetActive(params: URLSearchParams): boolean {
  return params.get(PRESET_PARAM) === PRESET_CLOSE_TO_DISTINGUISHED
}

/** Status internal ⇄ URL alias (kept stable for shared links / legacy redirect). */
const statusUrlToInternal = (raw: string | null): string | null => {
  switch (raw) {
    case 'thriving':
    case 'vulnerable':
      return raw
    case 'intervention':
      return 'intervention-required'
    default:
      return null
  }
}
const statusInternalToUrl = (raw: string): string | null => {
  if (raw === 'thriving' || raw === 'vulnerable') return raw
  if (raw === 'intervention-required') return 'intervention'
  return null
}

const FILTERABLE = COLUMN_CONFIGS.filter(c => c.filterable)

/**
 * Every URL key this module can emit — the parent reconcile loop deletes all of
 * these before re-setting the present ones, so a removed filter never sticks.
 */
export const FILTER_PARAM_KEYS: string[] = [
  SEARCH_PARAM,
  STATUS_PARAM,
  ...FILTERABLE.map(c => c.field).filter(f => f !== 'name' && f !== 'status'),
]

const parseNumericRange = (
  raw: string
): [number | null, number | null] | null => {
  // Require the `..` range form. A bare `?membership=10` (only ever from a
  // hand-edited URL — the writer always emits `min..max`) is intentionally
  // dropped rather than guessed at.
  if (!raw.includes('..')) return null
  const [lo, hi] = raw.split('..')
  const min = lo === '' ? null : Number(lo)
  const max = hi === '' ? null : Number(hi)
  if (
    (min !== null && Number.isNaN(min)) ||
    (max !== null && Number.isNaN(max))
  )
    return null
  if (min === null && max === null) return null
  return [min, max]
}

const serializeNumericRange = (value: (number | null)[]): string | null => {
  const min = value[0] ?? null
  const max = value[1] ?? null
  if (min === null && max === null) return null
  return `${min ?? ''}..${max ?? ''}`
}

/** Read a URLSearchParams into a FilterState. Unknown/reserved keys ignored. */
export function paramsToFilterState(params: URLSearchParams): FilterState {
  const state: FilterState = {}

  const status = statusUrlToInternal(params.get(STATUS_PARAM))
  if (status) {
    state['status'] = {
      field: 'status',
      type: 'categorical',
      value: [status],
      operator: 'in',
    }
  }

  const search = params.get(SEARCH_PARAM)
  if (search) {
    state['name'] = {
      field: 'name',
      type: 'text',
      value: search,
      operator: 'contains',
    }
  }

  for (const config of FILTERABLE) {
    const { field, filterType } = config
    if (field === 'name' || field === 'status') continue // handled above
    const raw = params.get(field)
    if (raw === null || raw === '') continue

    if (filterType === 'text') {
      state[field] = {
        field,
        type: 'text',
        value: raw,
        operator: 'contains',
      }
    } else if (filterType === 'numeric') {
      const range = parseNumericRange(raw)
      if (range) {
        state[field] = {
          field,
          type: 'numeric',
          value: range,
          operator: 'range',
        }
      }
    } else {
      // categorical
      const values = raw.split(',').filter(Boolean)
      if (values.length) {
        state[field] = {
          field,
          type: 'categorical',
          value: values,
          operator: 'in',
        }
      }
    }
  }

  return state
}

/** Serialize a FilterState to URL key/value pairs (present filters only). */
export function filterStateToParams(
  state: FilterState
): Array<[string, string]> {
  const out: Array<[string, string]> = []

  for (const field of Object.keys(state) as SortField[]) {
    const filter = state[field]
    if (!filter) continue

    if (field === 'status') {
      const values = Array.isArray(filter.value)
        ? (filter.value as string[])
        : []
      if (values.length === 1 && values[0]) {
        const alias = statusInternalToUrl(values[0])
        if (alias) out.push([STATUS_PARAM, alias])
      }
      continue
    }

    if (field === 'name') {
      if (typeof filter.value === 'string' && filter.value)
        out.push([SEARCH_PARAM, filter.value])
      continue
    }

    if (filter.type === 'text') {
      if (typeof filter.value === 'string' && filter.value)
        out.push([field, filter.value])
    } else if (filter.type === 'numeric') {
      const serialized = serializeNumericRange(
        filter.value as (number | null)[]
      )
      if (serialized) out.push([field, serialized])
    } else {
      const values = Array.isArray(filter.value)
        ? (filter.value as string[])
        : []
      const present = values.filter(Boolean)
      if (present.length) out.push([field, present.join(',')])
    }
  }

  return out
}

export type { ColumnFilter, FilterState }

import React, { useRef } from 'react'

/* District detail tab bar (#359). Pure presentational tablist — the
   parent owns activeTab state and routing/URL sync.

   WAI-ARIA tablist pattern (#384):
   - role=tablist on the container, role=tab on each button
   - Roving tabIndex: active tab is tabIndex=0, others are tabIndex=-1
   - Arrow keys (←/→) move focus with wrap; Home/End jump to first/last
   - Manual activation (Space/Enter) — focus moves on arrows but the
     activeTab only changes when the user explicitly activates, because
     tab content is heavy
   - aria-controls links each tab to its tabpanel id; the parent renders
     the panel with role=tabpanel + id + aria-labelledby. See
     `tabIdFor` / `panelIdFor` exports.
   Reference: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ */

/**
 * District tab IDs.
 *
 * #569 (IA Phase 1) collapsed 'overview' / 'trends' / 'analytics' into
 * a single scrollable narrative — none of them appear in the tab strip
 * anymore, but the IDs survive in this union so existing `?tab=...`
 * URLs still parse cleanly and the merged-panel id (`panelIdFor`) is
 * stable for a11y labelling. The remaining strip is Clubs / Divisions /
 * Global Rankings; Phases 2 + 3 will route them and the strip goes
 * away entirely.
 */
export type DistrictTabId =
  | 'overview'
  | 'clubs'
  | 'divisions'
  | 'trends'
  | 'analytics'
  | 'globalRankings'

/** Subset of DistrictTabId that actually appears in the tab strip after #569. */
export type DistrictStripTabId = 'clubs' | 'divisions' | 'globalRankings'

export const tabIdFor = (id: DistrictTabId) => `district-tab-${id}`
export const panelIdFor = (id: DistrictTabId) => `district-tabpanel-${id}`

interface DistrictDetailTabsProps {
  activeTab: DistrictTabId
  onTabChange: (tab: DistrictTabId) => void
  /** Optional count badge for the Clubs tab. Hidden when 0 or undefined. */
  clubsCount?: number
  /** Optional count badge for the Divisions & Areas tab. Hidden when 0 or undefined. */
  divisionsCount?: number
}

interface TabSpec {
  id: DistrictTabId
  label: string
  countKey?: 'clubsCount' | 'divisionsCount'
}

/**
 * Visible tab strip. #569 dropped Overview / Trends / Analytics —
 * their content scroll-stacks above the strip as one narrative now.
 * Phases 2 + 3 will route the three remaining destinations.
 */
const TABS: ReadonlyArray<TabSpec> = [
  { id: 'clubs', label: 'Clubs', countKey: 'clubsCount' },
  { id: 'divisions', label: 'Divisions & Areas', countKey: 'divisionsCount' },
  { id: 'globalRankings', label: 'Global Rankings' },
]

export const DistrictDetailTabs: React.FC<DistrictDetailTabsProps> = ({
  activeTab,
  onTabChange,
  clubsCount,
  divisionsCount,
}) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const handleClick = (tabId: DistrictTabId) => {
    if (tabId !== activeTab) {
      onTabChange(tabId)
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex = currentIndex
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % TABS.length
        break
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = TABS.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    tabRefs.current[nextIndex]?.focus()
  }

  return (
    <div
      className="district-detail-tabs"
      role="tablist"
      aria-label="District analysis tabs"
    >
      {TABS.map((tab, index) => {
        const isActive = activeTab === tab.id
        const count =
          tab.countKey === 'clubsCount'
            ? clubsCount
            : tab.countKey === 'divisionsCount'
              ? divisionsCount
              : undefined
        const showCount = typeof count === 'number' && count > 0

        return (
          <button
            key={tab.id}
            ref={el => {
              tabRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={tabIdFor(tab.id)}
            aria-selected={isActive}
            aria-controls={panelIdFor(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleClick(tab.id)}
            onKeyDown={event => handleKeyDown(event, index)}
            className={
              'district-detail-tabs__tab' +
              (isActive ? ' district-detail-tabs__tab--active' : '')
            }
          >
            <span className="district-detail-tabs__label">{tab.label}</span>
            {showCount && (
              <span className="district-detail-tabs__count">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

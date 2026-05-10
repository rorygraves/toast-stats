import React from 'react'

/* District detail tab bar (#359). Pure presentational tablist — the
   parent owns activeTab state and routing/URL sync. */

export type DistrictTabId =
  | 'overview'
  | 'clubs'
  | 'divisions'
  | 'trends'
  | 'analytics'
  | 'globalRankings'

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

const TABS: ReadonlyArray<TabSpec> = [
  { id: 'overview', label: 'Overview' },
  { id: 'clubs', label: 'Clubs', countKey: 'clubsCount' },
  { id: 'divisions', label: 'Divisions & Areas', countKey: 'divisionsCount' },
  { id: 'trends', label: 'Trends' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'globalRankings', label: 'Global Rankings' },
]

export const DistrictDetailTabs: React.FC<DistrictDetailTabsProps> = ({
  activeTab,
  onTabChange,
  clubsCount,
  divisionsCount,
}) => {
  const handleClick = (tabId: DistrictTabId) => {
    if (tabId !== activeTab) {
      onTabChange(tabId)
    }
  }

  return (
    <div
      className="district-detail-tabs"
      role="tablist"
      aria-label="District analysis tabs"
    >
      {TABS.map(tab => {
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
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(tab.id)}
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

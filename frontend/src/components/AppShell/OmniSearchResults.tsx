/* OmniSearchResults (epic #1055 Sprint 3, #1058) — the grouped ARIA listbox
   shared by the modal palette and the desktop header combobox. Presentational:
   it renders the result groups it is handed and reports hover/click; all state
   (query, active row, index load) lives in the caller via useOmniSearch.

   Each mount gets a distinct `listboxId`/`optionId` prefix so two instances can
   coexist in the DOM with valid, non-colliding ARIA ids. */

import React from 'react'
import { Link } from 'react-router-dom'
import {
  type SearchEntity,
  type SearchEntityType,
  type SearchResultGroup,
} from '../../services/searchIndex'
import { DistrictChipAndName } from '../DistrictChipAndName'

// Human-readable group headings, in the index's canonical group order.
const GROUP_LABEL: Record<SearchEntityType, string> = {
  district: 'Districts',
  region: 'Regions',
  club: 'Clubs',
}

interface OmniSearchResultsProps {
  groups: SearchResultGroup[]
  /** Already-clamped flat index of the highlighted row. */
  activeIndex: number
  onActivate: (flatIndex: number) => void
  /** Notification (no payload) that a result was chosen — callers close the
      surface here; navigation is handled by the result's own <Link>. */
  onSelect: () => void
  listboxId: string
  /** Prefix for each option's element id (must be unique per mount). */
  idPrefix: string
}

const OmniSearchResults: React.FC<OmniSearchResultsProps> = ({
  groups,
  activeIndex,
  onActivate,
  onSelect,
  listboxId,
  idPrefix,
}) => {
  const optionId = (e: SearchEntity) => `${idPrefix}-${e.type}-${e.id}`
  return (
    <ul
      id={listboxId}
      role="listbox"
      aria-label="Search results"
      className="command-palette__results"
    >
      {groups.map((group, gi) => {
        // Flat index of this group's first entity — groups render in the same
        // order they were flattened, so position gives the flat index directly.
        const offset = groups
          .slice(0, gi)
          .reduce((n, g) => n + g.entities.length, 0)
        return (
          <li
            key={group.type}
            role="group"
            aria-label={GROUP_LABEL[group.type]}
            className="command-palette__group"
          >
            <div className="command-palette__group-heading" aria-hidden="true">
              {GROUP_LABEL[group.type]}
            </div>
            <ul role="presentation" className="command-palette__group-list">
              {group.entities.map((entity, ei) => {
                const flatIdx = offset + ei
                const active = flatIdx === activeIndex
                return (
                  <li
                    key={optionId(entity)}
                    role="option"
                    aria-selected={active}
                    id={optionId(entity)}
                    onMouseEnter={() => onActivate(flatIdx)}
                    className={
                      'command-palette__result' +
                      (active ? ' command-palette__result--active' : '')
                    }
                  >
                    <Link
                      to={entity.route}
                      onClick={onSelect}
                      className="command-palette__result-link"
                    >
                      {renderEntity(entity)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        )
      })}
    </ul>
  )
}

// District results reuse the chip+name treatment (and its #522 no-duplicate
// guard); regions and clubs render their label plus disambiguation context.
function renderEntity(entity: SearchEntity) {
  if (entity.type === 'district') {
    return (
      <DistrictChipAndName
        districtId={entity.id}
        name={entity.label}
        chipClassName="command-palette__result-num"
        nameClassName="command-palette__result-name"
      />
    )
  }
  return (
    <>
      <span className="command-palette__result-name">{entity.label}</span>
      {entity.context && (
        <span className="command-palette__result-region">{entity.context}</span>
      )}
    </>
  )
}

export { GROUP_LABEL }
export default OmniSearchResults

import React from 'react'
import { hasDescriptiveName } from '../utils/districtName'

interface DistrictChipAndNameProps {
  districtId: string
  name?: string
  chipClassName?: string
  nameClassName?: string
  ariaHidden?: boolean
  testId?: string
}

const DEFAULT_CHIP_CLASS = 'districts-rankings-table__district-chip'
const DEFAULT_NAME_CLASS = 'ml-3 text-sm font-medium text-gray-900'

export const DistrictChipAndName: React.FC<DistrictChipAndNameProps> = ({
  districtId,
  name,
  chipClassName,
  nameClassName,
  ariaHidden,
  testId,
}) => (
  <>
    <span
      data-testid={testId ?? `district-number-chip-D${districtId}`}
      className={chipClassName ?? DEFAULT_CHIP_CLASS}
      aria-hidden={ariaHidden ? 'true' : undefined}
    >
      D{districtId}
    </span>
    {hasDescriptiveName(name) && (
      <span className={nameClassName ?? DEFAULT_NAME_CLASS}>{name}</span>
    )}
  </>
)

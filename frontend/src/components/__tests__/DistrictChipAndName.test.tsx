import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DistrictChipAndName } from '../DistrictChipAndName'

describe('DistrictChipAndName', () => {
  it('renders the D{id} chip', () => {
    render(<DistrictChipAndName districtId="86" />)
    expect(screen.getByText('D86')).toBeInTheDocument()
  })

  it('does NOT render the name when name is the bare district number', () => {
    render(<DistrictChipAndName districtId="86" name="86" />)
    expect(screen.getByText('D86')).toBeInTheDocument()
    expect(screen.queryByText('86')).not.toBeInTheDocument()
  })

  it('renders the name when descriptive', () => {
    render(<DistrictChipAndName districtId="57" name="District 57 Carolinas" />)
    expect(screen.getByText('D57')).toBeInTheDocument()
    expect(screen.getByText('District 57 Carolinas')).toBeInTheDocument()
  })

  it('omits the name span when name is undefined', () => {
    const { container } = render(<DistrictChipAndName districtId="110" />)
    expect(screen.getByText('D110')).toBeInTheDocument()
    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('omits the name span when name is whitespace-wrapped bare number', () => {
    const { container } = render(
      <DistrictChipAndName districtId="57" name="  57  " />
    )
    expect(screen.getByText('D57')).toBeInTheDocument()
    expect(container.querySelectorAll('span')).toHaveLength(1)
  })

  it('uses provided chipClassName and nameClassName', () => {
    const { container } = render(
      <DistrictChipAndName
        districtId="86"
        name="District 86 Ontario"
        chipClassName="custom-chip"
        nameClassName="custom-name"
      />
    )
    expect(container.querySelector('.custom-chip')).toHaveTextContent('D86')
    expect(container.querySelector('.custom-name')).toHaveTextContent(
      'District 86 Ontario'
    )
  })

  it('sets aria-hidden on the chip when requested', () => {
    render(<DistrictChipAndName districtId="86" ariaHidden />)
    expect(screen.getByText('D86')).toHaveAttribute('aria-hidden', 'true')
  })

  it('exposes a default data-testid', () => {
    render(<DistrictChipAndName districtId="86" />)
    expect(screen.getByTestId('district-number-chip-D86')).toHaveTextContent(
      'D86'
    )
  })
})

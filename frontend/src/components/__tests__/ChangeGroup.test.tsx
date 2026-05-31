import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChangeGroup } from '../ChangeGroup'
import type { DiffEvent } from '@toastmasters/shared-contracts'

/* Unit test for the District "What Changed" feed group (#1013, epic #1007).
   Every club-scoped change line links the club name to that club's detail page
   (/district/:districtId/club/:clubId). A club-less event (empty clubId) still
   renders as plain text — no broken/empty link. Tested directly, no page mount
   (R22); districtId is passed as a prop (R3), clubId comes from the event. */

const renderGroup = (events: DiffEvent[], districtId = '61') =>
  render(
    <MemoryRouter>
      <ChangeGroup
        category="membership"
        heading="Membership changes"
        events={events}
        districtId={districtId}
        collapsed={false}
        onToggle={() => {}}
      />
    </MemoryRouter>
  )

const event = (over: Partial<DiffEvent> = {}): DiffEvent => ({
  category: 'membership',
  clubId: '123',
  clubName: 'Acme Club',
  label: 'Acme Club gained 5 members',
  magnitude: 5,
  ...over,
})

describe('ChangeGroup club links (#1013)', () => {
  it('links the club name to its detail page for a club-scoped event', () => {
    renderGroup([event()], '61')

    const link = screen.getByRole('link', { name: /Acme Club/ })
    expect(link).toHaveAttribute('href', '/district/61/club/123')
    // The prose remainder stays as text; only the name is the link.
    expect(screen.getByText(/gained 5 members/)).toBeInTheDocument()
  })

  it('renders plain text with no link for a district-level (club-less) event', () => {
    renderGroup(
      [
        event({
          clubId: '',
          clubName: '',
          label: 'District membership shifted by 5',
        }),
      ],
      '61'
    )

    expect(
      screen.getByText('District membership shifted by 5')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('builds the href from the districtId prop, not from event data (R3)', () => {
    renderGroup(
      [
        event({
          clubId: '999',
          clubName: 'Beta Club',
          label: 'Beta Club lost 2 members',
        }),
      ],
      '42'
    )

    expect(screen.getByRole('link', { name: /Beta Club/ })).toHaveAttribute(
      'href',
      '/district/42/club/999'
    )
  })

  it('links the roster-move label whose name is followed by a "(Active)" suffix', () => {
    renderGroup(
      [
        event({
          category: 'club-added',
          clubId: '28680300',
          clubName: 'iA Montreal Toastmasters',
          label: 'iA Montreal Toastmasters (Active) joined the roster',
        }),
      ],
      '61'
    )

    const link = screen.getByRole('link', { name: /iA Montreal Toastmasters/ })
    expect(link).toHaveAttribute('href', '/district/61/club/28680300')
    expect(screen.getByText(/joined the roster/)).toBeInTheDocument()
  })

  it('renders nothing when the group has no events', () => {
    const { container } = renderGroup([])
    expect(container).toBeEmptyDOMElement()
  })
})

describe('ChangeGroup area/division links (#1014)', () => {
  it('links a division-status entity to its scoped division route', () => {
    renderGroup(
      [
        event({
          category: 'division-status',
          clubId: '',
          clubName: '',
          divisionId: 'G',
          entityName: 'Division G',
          label: 'Division G moved to Select Distinguished',
        }),
      ],
      '61'
    )

    const link = screen.getByRole('link', { name: /Division G/ })
    expect(link).toHaveAttribute('href', '/district/61/division/G')
    expect(
      screen.getByText(/moved to Select Distinguished/)
    ).toBeInTheDocument()
  })

  it('links an area-status entity to its division-scoped area route', () => {
    renderGroup(
      [
        event({
          category: 'area-status',
          clubId: '',
          clubName: '',
          divisionId: 'B',
          areaId: '2',
          entityName: 'Area 2',
          label: 'Area 2 moved to Confirmed Distinguished',
        }),
      ],
      '61'
    )

    const link = screen.getByRole('link', { name: /Area 2/ })
    expect(link).toHaveAttribute('href', '/district/61/division/B/area/2')
    expect(
      screen.getByText(/moved to Confirmed Distinguished/)
    ).toBeInTheDocument()
  })

  it('renders an area entity as plain text when its division ref is missing', () => {
    renderGroup(
      [
        event({
          category: 'area-status',
          clubId: '',
          clubName: '',
          areaId: '2',
          entityName: 'Area 2',
          label: 'Area 2 lost Distinguished status',
        }),
      ],
      '61'
    )

    expect(
      screen.getByText('Area 2 lost Distinguished status')
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

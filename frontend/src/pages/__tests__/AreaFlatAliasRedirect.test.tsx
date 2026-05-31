/**
 * Flat area-URL alias (#1017, epic #1008 Sprint 3).
 *
 * Decision: implement the operator's `/district/61/area/A1` example as a REDIRECT
 * to the canonical nested route (precedent: ClubRedirectPage #320), resolving the
 * division from the divisions snapshot — never string-parsing the area id (R3/R8).
 * A bad area id (no division owns it) throws a 404 to the branded error page,
 * exactly like the nested AreaPage.
 */
import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  useParams,
  useRouteError,
  isRouteErrorResponse,
} from 'react-router-dom'
import AreaRedirectPage from '../AreaRedirectPage'

const SNAPSHOT = {
  asOfDate: '2026-03-15',
  divisionPerformance: [
    {
      Division: 'A',
      Area: '10',
      'Club Number': '123456',
      'Club Name': 'Ottawa Club',
      'Division Club Base': '3',
      'Area Club Base': '1',
      'Nov Visit award': '1',
      'May Visit award': '0',
    },
  ],
  clubPerformance: [
    {
      'Club Number': '123456',
      'Club Name': 'Ottawa Club',
      'Club Status': 'Active',
      'Club Distinguished Status': 'Select Distinguished',
    },
  ],
}

vi.mock('../../hooks/useMembershipData', () => ({
  useDistrictStatistics: vi.fn(() => ({
    data: SNAPSHOT,
    isLoading: false,
    error: null,
  })),
}))

/** Sentinel for the canonical nested route — proves where the alias landed. */
function AreaTarget() {
  const { districtId, divId, areaId } = useParams()
  return (
    <div data-testid="area-target">{`${districtId}/${divId}/${areaId}`}</div>
  )
}

function StatusBoundary() {
  const err = useRouteError()
  const status = isRouteErrorResponse(err)
    ? err.status
    : err instanceof Response
      ? err.status
      : 'non-response'
  return <div data-testid="boundary">{status}</div>
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        errorElement: <StatusBoundary />,
        children: [
          {
            path: 'district/:districtId/area/:areaId',
            element: <AreaRedirectPage />,
          },
          {
            path: 'district/:districtId/division/:divId/area/:areaId',
            element: <AreaTarget />,
          },
        ],
      },
    ],
    { initialEntries: [path] }
  )
  return render(<RouterProvider router={router} />)
}

afterEach(() => cleanup())

describe('AreaRedirectPage flat alias (#1017)', () => {
  it('redirects /district/:id/area/:areaId to the canonical nested route', async () => {
    renderAt('/district/61/area/10')
    await waitFor(() =>
      expect(screen.getByTestId('area-target')).toHaveTextContent('61/A/10')
    )
  })

  it('throws a 404 for an area id no division owns', () => {
    renderAt('/district/61/area/99')
    expect(screen.getByTestId('boundary')).toHaveTextContent('404')
  })
})

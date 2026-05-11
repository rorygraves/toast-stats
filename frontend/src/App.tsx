import React, { Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import { ProgramYearProvider } from './contexts/ProgramYearContext'
import { DarkModeProvider } from './contexts/DarkModeContext'
import DistrictsPage from './pages/DistrictsPage'
import AppShell from './components/AppShell'

// Code-split: DistrictDetailPage (816 lines + recharts) loads on navigation (#169)
const DistrictDetailPage = React.lazy(
  () => import('./pages/DistrictDetailPage')
)

// Code-split: ClubDetailPage — full club subpage (#208)
const ClubDetailPage = React.lazy(() => import('./pages/ClubDetailPage'))

// Code-split: ClubRedirectPage — district-free club URL (#320)
const ClubRedirectPage = React.lazy(() => import('./pages/ClubRedirectPage'))

// Code-split: HistoryPage placeholder (#355) — real content in #367
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'))

// Code-split: MethodologyPage placeholder (#355) — real content in #368
const MethodologyPage = React.lazy(() => import('./pages/MethodologyPage'))

// Code-split: AwardsPage — top-10 leaderboards per district award (#370-#373)
const AwardsPage = React.lazy(() => import('./pages/AwardsPage'))

// Code-split: RegionPage — /region/:n landing (#423)
const RegionPage = React.lazy(() => import('./pages/RegionPage'))

/** Loading fallback for lazy-loaded pages */
function PageLoadingFallback(): React.JSX.Element {
  // AppShell owns the <main id="main-content"> landmark; this fallback
  // renders inside it during route-transition Suspense boundaries.
  return (
    <div
      className="tm-container"
      style={{ padding: '2rem', textAlign: 'center' }}
    >
      <div className="tm-loading-spinner" aria-label="Loading page…" />
    </div>
  )
}

// Create router configuration (ready for v7 future flags when available)
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppShell />,
      children: [
        {
          index: true,
          element: <DistrictsPage />,
        },
        {
          path: 'district/:districtId',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <DistrictDetailPage />
            </Suspense>
          ),
        },
        {
          path: 'district/:districtId/club/:clubId',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <ClubDetailPage />
            </Suspense>
          ),
        },
        {
          path: 'club/:clubId',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <ClubRedirectPage />
            </Suspense>
          ),
        },
        {
          path: 'history',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <HistoryPage />
            </Suspense>
          ),
        },
        {
          path: 'methodology',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <MethodologyPage />
            </Suspense>
          ),
        },
        {
          path: 'awards',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <AwardsPage />
            </Suspense>
          ),
        },
        {
          path: 'region/:n',
          element: (
            <Suspense fallback={<PageLoadingFallback />}>
              <RegionPage />
            </Suspense>
          ),
        },
      ],
    },
  ]
  // Future flags will be added when React Router v7 is available:
  // {
  //   future: {
  //     v7_startTransition: true,
  //     v7_relativeSplatPath: true,
  //   }
  // }
)

function App(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ProgramYearProvider>
        <DarkModeProvider>
          <RouterProvider router={router} />
        </DarkModeProvider>
      </ProgramYearProvider>
    </QueryClientProvider>
  )
}

export default App

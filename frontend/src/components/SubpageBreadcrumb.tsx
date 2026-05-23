import React from 'react'
import { Link } from 'react-router-dom'

/* #577 — Back-to-district breadcrumb for routed district sub-pages.

   Epic #568's IA migration converts in-tab views into routed sub-pages
   (`/district/:id/clubs`, `/divisions`, `/rankings`, `/club/:cid`). Each
   loses a clickable way back up the hierarchy, because DistrictDetailHeader's
   own breadcrumb was removed in #442 (it collided with the AppShell's
   "Districts" nav on the *landing* page — a collision that does NOT exist on
   sub-pages, where the crumb reads "District 61 › Clubs", not the duplicate
   "Districts › District 61").

   This is the single source of that affordance. Sub-pages opt in; the bare
   district landing opts out (preserving #442). Phase 3 pages (#571) drop it
   in with one line. See tasks/lessons/ entry for #577. */

export interface BreadcrumbCrumb {
  /** Visible text for the crumb. */
  label: string
  /** Target route. Omit on the final crumb to render it as the current page. */
  to?: string
  /** Optional React Router navigation state (e.g. filter round-trip). */
  state?: unknown
}

interface SubpageBreadcrumbProps {
  crumbs: BreadcrumbCrumb[]
}

export const SubpageBreadcrumb: React.FC<SubpageBreadcrumbProps> = ({
  crumbs,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 font-tm-body text-sm"
      data-testid="subpage-breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-2">
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  state={crumb.state}
                  className="text-tm-loyal-blue font-medium hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-gray-400">
                  ›
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

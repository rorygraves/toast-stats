/**
 * CriteriaExplanation Component
 *
 * Displays the Distinguished Area Program (DAP) criteria and eligibility requirements.
 * This component provides educational content to help Area Directors understand
 * the requirements for achieving Distinguished, Select Distinguished, and
 * President's Distinguished status.
 *
 * Requirements validated:
 * - 2.1: Show eligibility gate requirements prominently at the top
 * - 2.2: Explain that areas must have no net club loss (paid clubs >= club base)
 * - 2.3: Explain that 75% of club base must have first-round visits by Nov 30 and 75% must have second-round visits by May 31
 * - 2.4: Indicate that club visit data is not currently available from dashboard exports
 * - 2.5: Display eligibility status as "Unknown" when club visit data unavailable
 * - 3.1: Show that paid clubs must be at least equal to club base (no net loss)
 * - 3.2: Explain what constitutes a "paid club" (Active status, dues current)
 * - 3.3: Explain what statuses disqualify a club from being "paid" (Suspended, Ineligible, Low)
 * - 4.1: Show Distinguished Area requires paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase
 * - 4.2: Show Select Distinguished requires paidClubs >= clubBase AND distinguishedClubs >= 50% of clubBase + 1
 * - 4.3: Show President's Distinguished requires paidClubs >= clubBase + 1 AND distinguishedClubs >= 50% of clubBase + 1
 * - 4.4: Indicate percentages are calculated against club base, not paid clubs
 * - 4.5: Present recognition levels in ascending order of achievement
 *
 * Brand Guidelines:
 * - Uses TM Loyal Blue (#004165) for headers and primary elements
 * - Uses TM True Maroon (#772432) for emphasis
 * - Uses TM Cool Gray (#A9B2B1) for backgrounds
 * - Minimum 44px touch targets for interactive elements
 * - WCAG AA contrast requirements met
 */

import React, { useState } from 'react'
import { Card } from './ui/Card/Card'
import { useUrlBoolean } from '../hooks/useUrlBoolean'

/**
 * Props for the CriteriaExplanation component
 */
export interface CriteriaExplanationProps {
  /** Whether to show in collapsed/expanded state */
  defaultExpanded?: boolean
  /**
   * When set, the expand state deep-links via this URL search param (#980):
   * `?<urlParam>=1` when open, absent when collapsed. Requires a router in the
   * tree. When omitted, the panel keeps purely-local `useState` (router-free).
   */
  urlParam?: string
}

/**
 * CriteriaExplanation Component
 *
 * Renders an expandable/collapsible panel containing:
 * 1. Eligibility gate requirements (club visits)
 * 2. Paid clubs requirement (75% threshold)
 * 3. Recognition level criteria table
 *
 * @component
 * @example
 * ```tsx
 * <CriteriaExplanation defaultExpanded={true} />
 * ```
 */
const CriteriaExplanationView: React.FC<{
  isExpanded: boolean
  toggleExpanded: () => void
}> = ({ isExpanded, toggleExpanded }) => {
  return (
    <Card
      variant="default"
      padding="md"
      className="mb-6"
      aria-label="Distinguished Area Program criteria explanation"
    >
      {/* Header with expand/collapse toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between min-h-[44px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-tm-loyal-blue focus-visible:ring-offset-2 rounded-md"
        aria-expanded={isExpanded}
        aria-controls="criteria-content"
      >
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-tm-loyal-blue flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 font-tm-headline">
            Distinguished Area Program Criteria
          </h3>
        </div>
        <svg
          className={`w-5 h-5 text-tm-loyal-blue transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable content */}
      <div
        id="criteria-content"
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isExpanded}
      >
        {/* Eligibility Gate Section - Requirement 2 */}
        <section className="mb-6" aria-labelledby="eligibility-heading">
          <h4
            id="eligibility-heading"
            className="text-lg font-semibold text-tm-loyal-blue font-tm-headline mb-3 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Eligibility Gate
          </h4>
          <div className="bg-tm-cool-gray-10 border border-tm-cool-gray-30 rounded-lg p-4">
            <p className="text-gray-800 font-tm-body mb-3">
              Before an area can be considered for recognition, the following
              prerequisites must be met:
            </p>

            {/* No Net Club Loss Requirement */}
            <div className="flex items-start gap-3 bg-white rounded-md p-3 border border-tm-cool-gray-20 mb-3">
              <svg
                className="w-5 h-5 text-tm-loyal-blue flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 font-tm-body">
                  No Net Club Loss
                </p>
                <p className="text-gray-700 font-tm-body text-sm">
                  The area must have no net club loss — paid clubs must be at
                  least equal to the club base (the number of clubs at the start
                  of the program year).
                </p>
              </div>
            </div>

            {/* Club Visit Requirement */}
            <div className="flex items-start gap-3 bg-white rounded-md p-3 border border-tm-cool-gray-20">
              <svg
                className="w-5 h-5 text-tm-loyal-blue flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 font-tm-body">
                  Club Visit Reports
                </p>
                <p className="text-gray-700 font-tm-body text-sm">
                  75% of club base must have first-round visits completed by
                  November 30, and 75% must have second-round visits completed
                  by May 31.
                </p>
              </div>
            </div>

            {/* Data unavailable notice - Requirement 2.4, 2.5 */}
            <div className="mt-3 flex items-start gap-2 text-sm">
              <svg
                className="w-4 h-4 text-tm-true-maroon flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-gray-600 font-tm-body">
                <span className="font-semibold text-tm-true-maroon">
                  Club Visit Status: Unknown
                </span>{' '}
                — Club visit data is not currently available from dashboard
                exports. This requirement cannot be verified automatically.
              </p>
            </div>
          </div>
        </section>

        {/* No Net Club Loss Requirement Section - Requirement 3 */}
        <section className="mb-6" aria-labelledby="no-net-loss-heading">
          <h4
            id="no-net-loss-heading"
            className="text-lg font-semibold text-tm-loyal-blue font-tm-headline mb-3 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M6 10a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm2 1a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
            No Net Club Loss Requirement
          </h4>
          <div className="bg-tm-cool-gray-10 border border-tm-cool-gray-30 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-tm-loyal-blue text-white font-bold text-sm font-tm-headline px-2">
                ≥ Base
              </span>
              <p className="text-gray-800 font-tm-body">
                <strong>Paid clubs</strong> must be at least equal to the{' '}
                <strong>club base</strong> (no net loss of clubs).
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-800 font-tm-body">
                <strong>Club Base</strong> is the number of clubs in the area at
                the start of the program year. This is the baseline against
                which club growth or loss is measured.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              {/* What qualifies as paid */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h5 className="font-semibold text-green-800 font-tm-body mb-2 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Qualifies as Paid Club
                </h5>
                <ul className="text-sm text-green-700 font-tm-body space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      <strong>Active</strong> status
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Membership dues current</span>
                  </li>
                </ul>
              </div>

              {/* What disqualifies */}
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <h5 className="font-semibold text-red-800 font-tm-body mb-2 flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Does Not Qualify
                </h5>
                <ul className="text-sm text-red-700 font-tm-body space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>
                      <strong>Suspended</strong> status
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>
                      <strong>Ineligible</strong> status
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>
                      <strong>Low</strong> status
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Recognition Level Criteria Section - Requirement 4 */}
        <section aria-labelledby="recognition-levels-heading">
          <h4
            id="recognition-levels-heading"
            className="text-lg font-semibold text-tm-loyal-blue font-tm-headline mb-3 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Recognition Levels
          </h4>

          {/* Important note about calculation basis - Requirement 4.4 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800 font-tm-body flex items-start gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Important:</strong> Distinguished club percentages are
                calculated against the <strong>club base</strong> (starting
                clubs), not paid clubs.
              </span>
            </p>
          </div>

          {/* Recognition levels table - Requirement 4.5: ascending order */}
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              aria-label="Recognition level requirements"
            >
              <thead>
                <tr className="bg-tm-loyal-blue text-white">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left font-semibold font-tm-headline rounded-tl-lg"
                  >
                    Recognition Level
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center font-semibold font-tm-headline"
                  >
                    Paid Clubs Required
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-center font-semibold font-tm-headline rounded-tr-lg"
                  >
                    Distinguished Clubs Required
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Distinguished Area - Requirement 4.1 */}
                <tr className="border-b border-gray-200 bg-white hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-tm-happy-yellow text-gray-900">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                      <span className="font-semibold text-gray-900 font-tm-body">
                        Distinguished Area
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-tm-body text-gray-700">
                    ≥ Club Base
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-tm-happy-yellow-20 text-gray-900 font-semibold font-tm-body">
                      ≥ 50% of Club Base
                    </span>
                  </td>
                </tr>

                {/* Select Distinguished Area - Requirement 4.2 */}
                <tr className="border-b border-gray-200 bg-white hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-tm-cool-gray text-gray-900">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                      <span className="font-semibold text-gray-900 font-tm-body">
                        Select Distinguished Area
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-tm-body text-gray-700">
                    ≥ Club Base
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-tm-cool-gray-30 text-gray-900 font-semibold font-tm-body">
                      ≥ 50% of Club Base + 1
                    </span>
                  </td>
                </tr>

                {/* President's Distinguished Area - Requirement 4.3 */}
                <tr className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-3 rounded-bl-lg">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-tm-loyal-blue text-white">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                      <span className="font-semibold text-gray-900 font-tm-body">
                        President&apos;s Distinguished Area
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-tm-body text-gray-700">
                    ≥ Club Base + 1
                  </td>
                  <td className="px-4 py-3 text-center rounded-br-lg">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-tm-loyal-blue-20 text-tm-loyal-blue font-semibold font-tm-body">
                      ≥ 50% of Club Base + 1
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Additional explanation */}
          <p className="mt-4 text-sm text-gray-600 font-tm-body">
            A club is considered &quot;distinguished&quot; if it has achieved
            Distinguished, Select Distinguished, President&apos;s Distinguished,
            or Smedley Distinguished status.
          </p>
        </section>
      </div>
    </Card>
  )
}

/** URL-synced state source — only mounted when a urlParam is supplied. */
const UrlSyncedCriteriaExplanation: React.FC<{
  urlParam: string
  defaultExpanded: boolean
}> = ({ urlParam, defaultExpanded }) => {
  const [isExpanded, setIsExpanded] = useUrlBoolean(urlParam, {
    defaultValue: defaultExpanded,
  })
  return (
    <CriteriaExplanationView
      isExpanded={isExpanded}
      toggleExpanded={() => setIsExpanded(prev => !prev)}
    />
  )
}

/** Local (router-free) state source — the default. */
const LocalCriteriaExplanation: React.FC<{ defaultExpanded: boolean }> = ({
  defaultExpanded,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  return (
    <CriteriaExplanationView
      isExpanded={isExpanded}
      toggleExpanded={() => setIsExpanded(prev => !prev)}
    />
  )
}

export const CriteriaExplanation: React.FC<CriteriaExplanationProps> = ({
  defaultExpanded = false,
  urlParam,
}) =>
  urlParam ? (
    <UrlSyncedCriteriaExplanation
      urlParam={urlParam}
      defaultExpanded={defaultExpanded}
    />
  ) : (
    <LocalCriteriaExplanation defaultExpanded={defaultExpanded} />
  )

export default CriteriaExplanation

/* DistinguishedProgramCriteriaExplainer (#362 Divisions & Areas
   redesign) — collapsible <details> explaining the Distinguished
   Division Program (DDP) + Distinguished Area Program (DAP)
   thresholds. Sits between the Division Performance header and the
   per-division grid. Content mirrors the canonical rules in
   /methodology (#440). */

import React from 'react'
import { Link } from 'react-router-dom'

const DistinguishedProgramCriteriaExplainer: React.FC = () => {
  return (
    <details className="ddp-criteria">
      <summary className="ddp-criteria__summary">
        Distinguished Program criteria — how Divisions and Areas are recognized
      </summary>
      <div className="ddp-criteria__body">
        <p>
          The <strong>Distinguished Division Program (DDP)</strong> and{' '}
          <strong>Distinguished Area Program (DAP)</strong> recognize divisions
          and areas based on three measures, evaluated at the program year-end
          (June 30): <strong>distinguished clubs</strong>,{' '}
          <strong>paid clubs</strong>, and <strong>net club growth</strong>. A
          division or area must achieve
          <em> positive net club growth</em> (no net loss) to qualify for any
          recognition level.
        </p>

        <ul className="ddp-criteria__levels">
          <li>
            <span className="ddp-criteria__level-name ddp-criteria__level-name--presidents">
              President&apos;s
            </span>
            <span>
              ≥ 50% of clubs distinguished, AND ≥ 75% paid clubs at year-end,
              AND positive net club growth.
            </span>
          </li>
          <li>
            <span className="ddp-criteria__level-name ddp-criteria__level-name--select">
              Select
            </span>
            <span>≥ 40% distinguished, ≥ 75% paid, positive net growth.</span>
          </li>
          <li>
            <span className="ddp-criteria__level-name ddp-criteria__level-name--distinguished">
              Distinguished
            </span>
            <span>≥ 30% distinguished, ≥ 75% paid, positive net growth.</span>
          </li>
          <li>
            <span className="ddp-criteria__level-name">Not Distinguished</span>
            <span>
              Did not meet Distinguished thresholds, but maintained net club
              growth.
            </span>
          </li>
          <li>
            <span className="ddp-criteria__level-name ddp-criteria__level-name--loss">
              Net Loss
            </span>
            <span>
              Lost more clubs than were chartered/reinstated. Disqualified from
              all recognition levels.
            </span>
          </li>
        </ul>

        <p>
          <strong>1st &amp; 2nd Round visits</strong> (Areas only) — Area
          Directors are required to visit each club <em>twice per year</em>:
          once between July 1 and November 30 (Round 1), and once between
          December 1 and May 31 (Round 2). Visit completion contributes to the
          Area Director&apos;s own recognition.
        </p>

        <p className="ddp-criteria__source">
          Full rules:{' '}
          <Link to="/methodology" className="methodology-link">
            How it works
          </Link>{' '}
          · Source: <code>docs/toastmasters-rules-reference.md</code>
        </p>
      </div>
    </details>
  )
}

export default DistinguishedProgramCriteriaExplainer

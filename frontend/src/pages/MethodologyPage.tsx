import React from 'react'
import { Link } from 'react-router-dom'

/* Methodology page (#368). Authored fresh from analytics-core as the
   source of truth — Borda formula, DCP thresholds, club health
   classifications, refresh cadence. Future updates should land here
   first; the codebase comments reference this page for canonical
   definitions.

   #373: borda-count, dcp-tiers, and caveats sections link reciprocally
   back to the /awards page so readers can pivot between the formula
   and the live leaderboard. */

const SECTIONS: ReadonlyArray<{ id: string; num: string; title: string }> = [
  { id: 'data-source', num: '01', title: 'Data source & access' },
  { id: 'refresh-cadence', num: '02', title: 'Refresh cadence' },
  { id: 'borda-count', num: '03', title: 'Borda count scoring' },
  { id: 'dcp-tiers', num: '04', title: 'DCP tier definitions' },
  { id: 'club-health', num: '05', title: 'Club health classifications' },
  {
    id: 'district-membership-trend',
    num: '06',
    title: 'District Membership Trend',
  },
  { id: 'glossary', num: '07', title: 'Glossary' },
  { id: 'caveats', num: '08', title: 'Caveats & known issues' },
  { id: 'changelog', num: '09', title: 'Changelog' },
]

const MethodologyPage: React.FC = () => {
  return (
    <div className="methodology-page">
      <header className="methodology-page__header">
        <p className="placeholder-page__eyebrow">Reference · Updated 2026-05</p>
        <h1 className="placeholder-page__title">Methodology</h1>
        <p className="placeholder-page__body">
          How Toast Stats sources, processes, and ranks the worldwide
          Toastmasters dashboard. Everything here is reproducible from public
          data — no scraping, no inference.
        </p>
      </header>

      <nav aria-label="On this page" className="methodology-toc">
        <p className="methodology-toc__title">On this page</p>
        <ol className="methodology-toc__list">
          {SECTIONS.map(s => (
            <li key={s.id} className="methodology-toc__item">
              <span className="methodology-toc__num">{s.num}</span>
              <a href={`#${s.id}`} className="methodology-toc__link">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="data-source" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">01</span>
          Data source &amp; access
        </h2>
        <p>
          All numbers come from the public{' '}
          <a
            href="https://dashboards.toastmasters.org"
            target="_blank"
            rel="noopener noreferrer"
            className="methodology-link"
          >
            Toastmasters International dashboard
          </a>{' '}
          — the same files district leadership uses internally. Toast Stats
          pulls the published CSVs (district-performance, club-performance,
          payments, education awards), validates them against the contract
          schemas, and stores per-day snapshots in a public read-only CDN.
        </p>
        <p>
          Nothing private. Nothing scraped. If TI changes the column names or
          stops publishing a file, the pipeline fails loudly rather than
          silently inferring values.
        </p>
      </section>

      <section id="refresh-cadence" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">02</span>
          Refresh cadence
        </h2>
        <p>
          The data pipeline runs once daily at 09:15 UTC (≈04:15 ET / 02:15 PT)
          — the schedule lives in{' '}
          <code>.github/workflows/data-pipeline.yml</code>. Each run pulls the
          latest TI CSVs, transforms them, computes rankings + analytics, and
          writes a dated snapshot to GCS. Frontend serves the most recent
          snapshot via the CDN with a 5-minute stale-while-revalidate cache.
        </p>
        <p>
          Stale-data indicator: every page surfaces a "Data fresh ·
          &lt;date&gt;" pill so you always know which snapshot you're seeing.
        </p>
      </section>

      <section id="borda-count" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">03</span>
          Borda count scoring
        </h2>
        <p>
          Each district is ranked separately in three categories:
          <strong> Paid Clubs</strong>, <strong>Total Payments</strong>, and{' '}
          <strong>Distinguished Clubs</strong>. Points are awarded based on rank
          position — with N districts, rank #1 receives N points, rank #2
          receives N−1, and so on down to 1 point for last place.
        </p>
        <p>
          The <strong>Aggregate Score</strong> shown on the District Rankings
          page is the sum of points across all three categories. With 117
          districts: a district ranked #5 / #3 / #8 earns 113 + 115 + 110 = 338
          points (higher is better). This is the standard Borda count method; it
          weights all three categories equally.
        </p>
        <p className="methodology-source">
          See the live{' '}
          <Link to="/awards" className="methodology-link">
            District Awards leaderboards
          </Link>{' '}
          for the three competitive recognitions ranked from this data:
          President's Extension, President's 20-Plus, and District Club
          Retention.
        </p>
      </section>

      <section id="dcp-tiers" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">04</span>
          DCP tier definitions
        </h2>
        <p>Distinguished Club Program tiers, in ascending order:</p>
        <ul>
          <li>
            <strong>Distinguished</strong> — 5 of 10 DCP goals AND (20+ paid
            members OR net growth ≥ 3).
          </li>
          <li>
            <strong>Select Distinguished</strong> — 7 of 10 goals AND (20+ paid
            members OR net growth ≥ 5).
          </li>
          <li>
            <strong>President's Distinguished</strong> — 9 of 10 goals AND 20+
            paid members. <em>No growth alternative.</em>
          </li>
          <li>
            <strong>Smedley Distinguished</strong> — 10 of 10 goals AND 25+ paid
            members. <em>No growth alternative.</em> New for the 2025-2026
            program year.
          </li>
        </ul>
        <p>
          The 10 DCP goals are <strong>independent</strong>, not sequential — a
          club can achieve goals in any order. Toast Stats reads the raw
          per-goal columns from <code>club-performance.csv</code> rather than
          inferring from a single "goals achieved" count.
        </p>
        <p className="methodology-source">
          Source: <code>docs/toastmasters-rules-reference.md</code> §3.2 /
          Toastmasters Distinguished Club Program documentation. The
          determination logic lives in{' '}
          <code>frontend/src/utils/dcpProjections.ts</code> (
          <code>determineLevel</code>).
        </p>
        <p className="methodology-source">
          The{' '}
          <Link to="/awards" className="methodology-link">
            President's 20-Plus Award leaderboard
          </Link>{' '}
          ranks districts by the percentage of clubs achieving 20+ paid members
          — the same denominator that underpins the Distinguished tier
          definitions above.
        </p>
      </section>

      <section id="club-health" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">05</span>
          Club health classifications
        </h2>
        <p>
          Toast Stats classifies each club into one of three mutually exclusive
          health statuses, recomputed every snapshot from the current data
          (never persisted as a property of the club):
        </p>
        <ul>
          <li>
            <strong>Thriving</strong> (<code>thriving</code>) — meets all three:
            <ul>
              <li>
                20+ paid members OR net growth ≥ 3 since program-year base
              </li>
              <li>On track for the program-month DCP checkpoint</li>
              <li>Club Success Plan (CSP) submitted (2025-26 onward)</li>
            </ul>
          </li>
          <li>
            <strong>Vulnerable</strong> (<code>vulnerable</code>) — at least one
            of the three Thriving requirements is unmet, but the club has not
            crossed the intervention threshold below.
          </li>
          <li>
            <strong>Intervention Required</strong> (
            <code>intervention-required</code>) — paid members &lt; 12 AND net
            growth &lt; 3 since program-year base. This rule overrides all other
            criteria.
          </li>
        </ul>
        <p className="methodology-source">
          Source:{' '}
          <code>
            packages/analytics-core/src/analytics/ClubHealthAnalyticsModule.ts
          </code>{' '}
          (lines 316–360); type definition in{' '}
          <code>packages/shared-contracts/src/types/club-health-status.ts</code>
          . The DCP checkpoint progression by program month lives in the same
          analytics module. Toast Stats health is a project-specific overlay,
          not an official Toastmasters International metric.
        </p>
      </section>

      <section id="district-membership-trend" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">06</span>
          District Membership Trend
        </h2>
        <p>
          The chart on the District Detail · Trends tab plots a single metric:
          the district&apos;s <strong>total paid members</strong> at each
          snapshot date during the selected program year (Jul 1 – Jun 30).
        </p>
        <ul>
          <li>
            <strong>Source.</strong> The raw value comes from the Toastmasters
            District Performance dashboard — the same source the Toastmasters
            International office uses for monthly published rankings.
          </li>
          <li>
            <strong>Snapshot frequency.</strong> Toast Stats prunes to one
            snapshot per month (typically the last business day&apos;s data).
            Daily snapshots before pruning are not retained.
          </li>
          <li>
            <strong>Program-year scope.</strong> The default chart shows the
            currently selected program year. Use the program-year selector to
            inspect prior years.
          </li>
          <li>
            <strong>Comparison series.</strong> Prior-year data is overlaid as a
            faint reference line so you can visually compare YoY growth at the
            same calendar week.
          </li>
          <li>
            <strong>Y-axis.</strong> &quot;Paid Members&quot; — count of members
            with current paid memberships, NOT a payment count (members
            typically pay twice per year, so payment count ≈ 2× member count
            over a full year).
          </li>
        </ul>
        <p>
          Growth and decline period overlays in the chart are computed from
          consecutive month-over-month deltas; the threshold and detection logic
          live in <code>frontend/src/components/MembershipTrendChart.tsx</code>.
        </p>
      </section>

      <section id="glossary" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">07</span>
          Glossary
        </h2>
        <dl className="methodology-glossary">
          <dt>Paid Club</dt>
          <dd>
            A club with at least 8 paid members that has met its renewal
            obligations (October &amp; April cycles).
          </dd>
          <dt>Paid Club Base</dt>
          <dd>
            A district's paid-club count at the start of the program year (July
            1) — the denominator for retention.
          </dd>
          <dt>New Charter</dt>
          <dd>
            A club chartered during the current program year. Counts toward the
            President's Extension Award but not toward retention.
          </dd>
          <dt>Distinguished Percent</dt>
          <dd>
            (Distinguished + Select + President's + Smedley clubs) ÷ paid clubs
            at year-end.
          </dd>
          <dt>Aggregate Score</dt>
          <dd>
            Sum of Borda points across paid clubs, payments, and distinguished.
            See{' '}
            <a href="#borda-count" className="methodology-link">
              §03
            </a>
            .
          </dd>
        </dl>
      </section>

      <section id="caveats" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">08</span>
          Caveats &amp; known issues
        </h2>
        <ul>
          <li>
            <strong>Pre-2019 data</strong> — Toast Stats only stores snapshots
            from PY 2019–20 onward. Earlier seasons live in TI's own archive.
          </li>
          <li>
            <strong>Mid-PY restatements</strong> — TI occasionally republishes
            corrected files. Toast Stats keeps the latest published version and
            does not back-fill prior days; small day-over-day deltas occur
            during corrections.
          </li>
          <li>
            <strong>Charter date parsing</strong> — historical charter dates in{' '}
            <code>district-performance.csv</code> use a 2-digit year format (
            <code>04/15/26</code>); the parser explicitly handles this. See{' '}
            <code>tasks/lessons.md</code> Lesson 47 for context.
          </li>
          <li>
            <strong>Extension and Retention award rounding</strong> — the live{' '}
            <Link to="/awards" className="methodology-link">
              District Awards leaderboards
            </Link>{' '}
            display computed values to one decimal place. Ties at that precision
            are broken by raw paid-club counts; the underlying ranking uses
            unrounded values.
          </li>
        </ul>
      </section>

      <section id="changelog" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">09</span>
          Changelog
        </h2>
        <p>
          Material methodology changes are recorded as ADRs in{' '}
          <code>docs/architecture-decisions/</code> and as releases on{' '}
          <a
            href="https://github.com/taverns-red/toast-stats/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="methodology-link"
          >
            GitHub Releases
          </a>
          . Recent notable updates:
        </p>
        <ul>
          <li>
            <strong>2026-04</strong> — Retention award formula split from
            Extension to count only base-club survival (excludes new charters).
            #336.
          </li>
          <li>
            <strong>2026-04</strong> — Distinguished District tier tracking
            added; per-district trophy case on the District page. #332.
          </li>
          <li>
            <strong>2026-05</strong> — 2026 redesign: new chrome (top bar,
            footer, panels), token system migration, dark-mode-aware surfaces.
            Epic #352.
          </li>
        </ul>
      </section>
    </div>
  )
}

export default MethodologyPage

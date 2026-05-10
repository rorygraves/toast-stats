import React from 'react'

/* Methodology page (#368). Authored fresh from analytics-core as the
   source of truth — Borda formula, DCP thresholds, club health
   classifications, refresh cadence. Future updates should land here
   first; the codebase comments reference this page for canonical
   definitions. */

const SECTIONS: ReadonlyArray<{ id: string; num: string; title: string }> = [
  { id: 'data-source', num: '01', title: 'Data source & access' },
  { id: 'refresh-cadence', num: '02', title: 'Refresh cadence' },
  { id: 'borda-count', num: '03', title: 'Borda count scoring' },
  { id: 'dcp-tiers', num: '04', title: 'DCP tier definitions' },
  { id: 'club-health', num: '05', title: 'Club health classifications' },
  { id: 'glossary', num: '06', title: 'Glossary' },
  { id: 'caveats', num: '07', title: 'Caveats & known issues' },
  { id: 'changelog', num: '08', title: 'Changelog' },
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
      </section>

      <section id="dcp-tiers" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">04</span>
          DCP tier definitions
        </h2>
        <p>Distinguished Club Program tiers, in ascending order:</p>
        <ul>
          <li>
            <strong>Distinguished</strong> — 5 of 10 DCP goals + 20+ paid
            members or net +5 / 75% retention.
          </li>
          <li>
            <strong>Select Distinguished</strong> — 7 of 10 goals + same
            membership floor.
          </li>
          <li>
            <strong>President's Distinguished</strong> — 9 of 10 goals + same
            membership floor.
          </li>
          <li>
            <strong>Smedley Award</strong> — President's Distinguished +
            chartered new club (rare; honors club founders).
          </li>
        </ul>
        <p>
          The 10 DCP goals are <strong>independent</strong>, not sequential — a
          club can achieve goals in any order. Toast Stats reads the raw
          per-goal columns from <code>club-performance.csv</code> rather than
          inferring from a single "goals achieved" count.
        </p>
      </section>

      <section id="club-health" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">05</span>
          Club health classifications
        </h2>
        <p>
          Health is a Toast Stats overlay (not an official TI metric) that
          combines membership trend + DCP progress + payment timeliness:
        </p>
        <ul>
          <li>
            <strong>Thriving</strong> — current paid members ≥ base, on track
            for Distinguished or higher, no missed renewals.
          </li>
          <li>
            <strong>Healthy</strong> — paid members ≥ base, mid-tier DCP
            progress, no urgent flags.
          </li>
          <li>
            <strong>Watch</strong> — small drop below base, behind on DCP, or
            one missed renewal cycle.
          </li>
          <li>
            <strong>At-risk</strong> — sustained membership drop, two missed
            renewal cycles, or under 8 paid members.
          </li>
        </ul>
        <p>
          The exact thresholds live in <code>analytics-core</code>. Health is
          recomputed every snapshot and never persisted as a property of the
          club — it's always a function of the current data.
        </p>
      </section>

      <section id="glossary" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">06</span>
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
          <span className="methodology-section__num">07</span>
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
        </ul>
      </section>

      <section id="changelog" className="methodology-section">
        <h2 className="methodology-section__title">
          <span className="methodology-section__num">08</span>
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

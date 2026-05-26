import React from 'react'
import { Link } from 'react-router-dom'
import InfoTooltip from './InfoTooltip'
import type {
  CompetitiveAwardRanking,
  CompetitiveAwardStandings,
} from '../services/cdn'

/* AwardsRaceSection — 2026 redesign 3-card contender summary (#357).
   The deeper top-10 leaderboards move to the future Awards page (Epic
   #370). This panel lives at the top of the Districts leaderboard
   between the global KPI strip and the rankings table. */

interface AwardsRaceSectionProps {
  /** Competitive award standings; null means no data for this snapshot */
  standings: CompetitiveAwardStandings | null
  /**
   * True while the competitive-awards query is still in flight (#750). This
   * query resolves *separately from and later than* the rankings query that
   * paints the page, so without a reserved slot the section pops in late and
   * shoves the toolbar + rankings table down ~286px → CLS 0.198 (the
   * secondary source Lesson 079 deferred). When loading we render a
   * height-matched skeleton so the real cards fill the slot in place.
   */
  isLoading?: boolean
}

interface AwardCardSpec {
  title: string
  /** Threshold sub-line per design (e.g. "15 new charter strength clubs"). */
  threshold: string
  /** Format the leader's value for display (e.g. "+14", "94.1%"). */
  formatValue: (value: number) => string
  /** Compute progress percentage 0-100 from the leader's value. */
  computeProgress: (value: number) => number
}

const AWARD_CARDS: ReadonlyArray<{
  key: keyof Pick<
    CompetitiveAwardStandings,
    'extensionAward' | 'twentyPlusAward' | 'retentionAward'
  >
  spec: AwardCardSpec
}> = [
  {
    key: 'extensionAward',
    spec: {
      title: "President's Extension Award",
      threshold: 'Most new paid clubs vs prior year',
      formatValue: v => (v >= 0 ? `+${v}` : `${v}`),
      // Winners are flagged separately; non-winners progress against a
      // soft target of 15 (matches the design's reference threshold).
      computeProgress: v => Math.min(100, Math.max(0, (v / 15) * 100)),
    },
  },
  {
    key: 'twentyPlusAward',
    spec: {
      title: "President's 20-Plus Award",
      threshold: '% of paid clubs with 20+ members',
      formatValue: v => `${v.toFixed(1)}%`,
      computeProgress: v => Math.min(100, Math.max(0, v)),
    },
  },
  {
    key: 'retentionAward',
    spec: {
      title: 'District Club Retention Award',
      threshold: '90% retention of last year’s clubs',
      formatValue: v => `${v.toFixed(1)}%`,
      computeProgress: v => Math.min(100, Math.max(0, v)),
    },
  },
]

export const AwardsRaceSection: React.FC<AwardsRaceSectionProps> = ({
  standings,
  isLoading = false,
}) => {
  // Reserve the slot while the (separate, slower) competitive-awards query is
  // in flight so its late arrival doesn't shift the page below it (#750).
  // Once the query settles with genuinely no data, collapse to null (rare
  // legacy-snapshot case — the file predates #330).
  if (!standings) return isLoading ? <AwardsRaceSkeleton /> : null

  const cardData = AWARD_CARDS.map(({ key, spec }) => {
    const entries = standings[key] ?? []
    return { spec, entries }
  })

  const allEmpty = cardData.every(({ entries }) => entries.length === 0)
  if (allEmpty) return null

  const updatedAt = (() => {
    const raw = standings.metadata?.calculatedAt
    if (!raw) return null
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  })()

  return (
    <section className="awards-race" aria-labelledby="awards-race-heading">
      <header className="awards-race__header">
        <h2 id="awards-race-heading" className="awards-race__title">
          Awards Race · Top contenders
          <InfoTooltip text="Top-3 districts contending for each Toastmasters competitive award this program year. Source: All-Districts CSV. See How it works for definitions." />
        </h2>
        {updatedAt && (
          <span className="awards-race__meta">Updated {updatedAt}</span>
        )}
      </header>
      <div className="awards-race__grid">
        {cardData.map(({ spec, entries }) => (
          <AwardCard key={spec.title} spec={spec} entries={entries} />
        ))}
      </div>
    </section>
  )
}

/**
 * Height-matched placeholder shown while the competitive-awards query loads
 * (#750). Reuses the real `awards-race` / `awards-race-card` chrome and the
 * *static* card titles + thresholds (the tallest, wrap-prone rows) so the
 * reserved height tracks the loaded section across breakpoints, leaving only
 * the fixed-height data rows as skeleton bars. aria-hidden: it carries no
 * information for assistive tech.
 */
const AwardsRaceSkeleton: React.FC = () => (
  <section
    className="awards-race"
    aria-hidden="true"
    data-testid="awards-race-skeleton"
  >
    <header className="awards-race__header">
      <span
        className="awards-race-skeleton__bar awards-race-skeleton__bar--heading"
        style={{ width: 200 }}
      />
    </header>
    <div className="awards-race__grid">
      {AWARD_CARDS.map(({ key, spec }) => (
        <article className="awards-race-card" key={key}>
          <header className="awards-race-card__header">
            <h3 className="awards-race-card__title">{spec.title}</h3>
            <p className="awards-race-card__threshold">{spec.threshold}</p>
          </header>
          <div className="awards-race-card__row">
            <span className="awards-race-skeleton__bar awards-race-skeleton__bar--leader" />
            <span className="awards-race-skeleton__bar awards-race-skeleton__bar--value" />
          </div>
          <div className="awards-race-card__progress-track" />
          <div className="awards-race-card__status">
            <span aria-hidden="true" className="awards-race-card__status-dot" />
            <span className="awards-race-skeleton__bar awards-race-skeleton__bar--status" />
          </div>
        </article>
      ))}
    </div>
  </section>
)

interface AwardCardProps {
  spec: AwardCardSpec
  entries: CompetitiveAwardRanking[]
}

const AwardCard: React.FC<AwardCardProps> = ({ spec, entries }) => {
  const leader = entries[0]
  const winners = entries.filter(e => e.isWinner)
  const isAchieved = leader?.isWinner ?? false

  if (!leader) {
    return (
      <article className="awards-race-card">
        <header className="awards-race-card__header">
          <h3 className="awards-race-card__title">{spec.title}</h3>
          <p className="awards-race-card__threshold">{spec.threshold}</p>
        </header>
        <p className="awards-race-card__empty">No standings yet.</p>
      </article>
    )
  }

  const progress = isAchieved ? 100 : spec.computeProgress(leader.value)

  return (
    <article className="awards-race-card">
      <header className="awards-race-card__header">
        <h3 className="awards-race-card__title">{spec.title}</h3>
        <p className="awards-race-card__threshold">{spec.threshold}</p>
      </header>
      <div className="awards-race-card__row">
        <Link
          to={`/district/${leader.districtId}`}
          className="awards-race-card__leader-link"
        >
          D{leader.districtId}
        </Link>
        <span className="awards-race-card__leader-value">
          {spec.formatValue(leader.value)}
        </span>
      </div>
      <div
        className="awards-race-card__progress-track"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${spec.title} progress`}
      >
        <div
          className={
            'awards-race-card__progress-fill' +
            (isAchieved ? ' awards-race-card__progress-fill--won' : '')
          }
          style={{ width: `${progress}%` }}
        />
      </div>
      <footer
        className={
          'awards-race-card__status' +
          (isAchieved ? ' awards-race-card__status--won' : '')
        }
      >
        <span aria-hidden="true" className="awards-race-card__status-dot" />
        {isAchieved ? (
          <span>
            ✓ Achieved
            {winners.length > 1 && ` · ${winners.length} districts qualifying`}
          </span>
        ) : (
          <span>
            Leader · next contender at{' '}
            {entries[1] ? spec.formatValue(entries[1].value) : '—'}
          </span>
        )}
      </footer>
    </article>
  )
}

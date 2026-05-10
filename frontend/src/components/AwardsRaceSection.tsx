import React from 'react'
import { Link } from 'react-router-dom'
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
}

interface AwardCardSpec {
  title: string
  description: string
  /** Format the leader's value for display (e.g. "+14", "94.1%"). */
  formatValue: (value: number) => string
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
      description: 'Largest net club growth',
      formatValue: v => (v >= 0 ? `+${v}` : `${v}`),
    },
  },
  {
    key: 'twentyPlusAward',
    spec: {
      title: "President's 20-Plus Award",
      description: 'Highest % clubs with 20+ paid members',
      formatValue: v => `${v.toFixed(1)}%`,
    },
  },
  {
    key: 'retentionAward',
    spec: {
      title: 'District Club Retention Award',
      description: 'Top retention (≥90% paid clubs)',
      formatValue: v => `${v.toFixed(1)}%`,
    },
  },
]

export const AwardsRaceSection: React.FC<AwardsRaceSectionProps> = ({
  standings,
}) => {
  if (!standings) return null

  const cardData = AWARD_CARDS.map(({ key, spec }) => {
    const entries = standings[key] ?? []
    return { spec, entries }
  })

  const allEmpty = cardData.every(({ entries }) => entries.length === 0)
  if (allEmpty) return null

  return (
    <section className="awards-race" aria-labelledby="awards-race-heading">
      <header className="awards-race__header">
        <h2 id="awards-race-heading" className="awards-race__title">
          Awards Race
        </h2>
        <p className="awards-race__subtitle">Top contender per award</p>
      </header>
      <div className="awards-race__grid">
        {cardData.map(({ spec, entries }) => (
          <AwardCard key={spec.title} spec={spec} entries={entries} />
        ))}
      </div>
    </section>
  )
}

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
          <p className="awards-race-card__description">{spec.description}</p>
        </header>
        <p className="awards-race-card__empty">No standings yet.</p>
      </article>
    )
  }

  return (
    <article className="awards-race-card">
      <header className="awards-race-card__header">
        <h3 className="awards-race-card__title">{spec.title}</h3>
        <p className="awards-race-card__description">{spec.description}</p>
      </header>
      <div className="awards-race-card__leader">
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
      <footer className="awards-race-card__footer">
        {isAchieved ? (
          <>
            <span className="awards-race-card__status awards-race-card__status--achieved">
              ✓ Achieved
            </span>
            {winners.length > 1 && (
              <span className="awards-race-card__hint">
                · {winners.length} districts qualifying
              </span>
            )}
          </>
        ) : (
          <span className="awards-race-card__status">
            Leader · next contender at{' '}
            {entries[1] ? spec.formatValue(entries[1].value) : '—'}
          </span>
        )}
      </footer>
    </article>
  )
}

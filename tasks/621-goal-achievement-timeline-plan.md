# Sprint 4 (#621) — Goal Achievement Timeline — Design Note

Branch: `feat/621-goal-achievement-timeline` (based off current `origin/main` tip
2baf744e — includes Sprints 1–3). Worktree was 4 commits behind; rebased per Lesson 090.

## Deliverables (from #621)

1. **analytics-core helper** `goalsMetAtDate` — exact-date goals-met lookup.
2. **frontend hook** `useClubGoalTimeline` — 5 checkpoint rows + nearest-before fallback.
3. **component** `<GoalAchievementTimeline>` — pixel-mapped `.timeline-row` grid.
4. Wire into `ClubDCPGoalsPanel` between progress bar and per-goal grid.
5. CSS `.timeline-row` (desktop 90px 1fr 60px 50px; ≤640px 70px 1fr 50px 40px).
6. `docs/product-spec.md` line.

## Key data-flow finding (traced, not assumed)

`ClubTrend.dcpGoalsTrend: { date, goalsAchieved }[]` is **the club-scoped projection
of every snapshot** — `goalsAchieved` is already computed by analytics-core
(`TimeSeriesDataPointBuilder` parses the raw `Goals Met` field, the INDEPENDENT count
— tripwire-compliant, never inferred as Goals 1-N). The frontend receives this trend
pre-computed via `useDistrictAnalytics`; it never holds raw `Snapshot[]`.

## Deliberate signature adaptation (documented for review)

The issue sketches `goalsMetAtDate(clubId, date)` "reads the snapshot … locates the
club." A pure function needs the data passed in. Two faithful options:

- **(A) `goalsMetAtDate(snapshots, clubId, date)`** — snapshot-level. Matches the prose
  literally but the frontend has no `Snapshot[]`, so the shipped hook could not call
  it → it would be a tested-but-unused export (violates DoD "Minimal Surface Area").
- **(B) `goalsMetAtDate(goalsHistory, date)`** — operates on the club's
  `DcpGoalsTrendPoint[]` (the per-snapshot history). DRY: the hook actually calls it.
  Satisfies all three required test cases:
  - known historical date → count
  - missing snapshot (date absent from history) → null
  - "club not in snapshot" → empty/absent history → null

**Chosen (B).** DRY + non-dead-code + tripwire-compliant beats literal signature.
`dcpGoalsTrend` ≡ "this club across all snapshots", so a date lookup over it is exactly
"goals met by this club at date." Documented in the helper doc, PR body, and a lesson.

## Hook contract (R3-compliant)

Parent (`ClubDetailPage`) already derives `programYear` + `effectiveEndDate` + `club`.
Per R3 (pass context as props; never re-derive in a child), the hook RECEIVES them —
it does not re-fetch by clubId:

`useClubGoalTimeline(dcpGoalsTrend, programYear, asOfDate) => GoalTimelineRow[]`

Checkpoints from `programYear.year` (= start year):
Sep 1, Nov 1 (start year); Jan 1, Mar 1 (start+1); current (= asOfDate).
For each: exact via `goalsMetAtDate`; else nearest point with `date <= target`
(record `actualDate`, `isFallback`). Row carries `gain` = Δ vs previous row
(null on first). Rows whose target precedes the earliest snapshot are dropped.

## Component / CSS

`<GoalAchievementTimeline rows>` under `.dcp-subhead` heading "Goal Achievement Timeline".
Row: date (mono) · `.bar-track`/`.bar-fill` (6px, width = goalsMet/10) · `N/10` · gain
(`+N` green `--green-600` / `-N` red `--red-600` / muted). Fallback rows: show actual
snapshot date + `title` tooltip + footnote noting nearest-snapshot substitution.
Dark mode mirrored onto `[data-theme='dark']` (R10), bar-fill `#8ec5e8` to match
Sprint 3's progress fill. Mobile grid per spec at ≤640px.

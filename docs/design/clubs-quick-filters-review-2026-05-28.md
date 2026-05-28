# Critical review: Clubs quick-filter row (post-consolidation)

**Date:** 2026-05-28 · **Tracking:** #853 (epic #854)
**Skills applied:** ron-pm, ron-ux, ron-sa
**Scope:** the single "Quick filters:" row on the district clubs table after the
#815/#829 consolidation merged the former status segmented-control and the chip
strip into one row. **Recommendations only — no code change in this sprint.**
**Operator framing:** "still a mishmash, I don't like what we have."

Predecessor doc: [`table-ux-review-2026-05-27.md`](./table-ux-review-2026-05-27.md)
§1 (the original "double quick-filters" problem). This doc reviews what the
consolidation actually shipped, not the problem it inherited.

---

## 1. Current-state inventory

All references point at `frontend/src/components/ClubsTable.tsx` on `origin/main`
unless stated. The row is rendered inside the panel header at
[`ClubsTable.tsx:715–897`](../../frontend/src/components/ClubsTable.tsx#L715).

### 1.1 Anatomy

| # | Control | File:line | Field written | Value written | Selection model |
|---|---|---|---|---|---|
| L | `Quick filters:` label | `ClubsTable.tsx:716` | — | — | — |
| 1 | **Thriving** chip + count | `ClubsTable.tsx:722, 731–746` | `status` | `['thriving']` | single-select within bands; toggling the active one clears |
| 2 | **Vulnerable** chip + count | `ClubsTable.tsx:723, 731–746` | `status` | `['vulnerable']` | same |
| 3 | **Intervention** chip + count | `ClubsTable.tsx:724–728, 731–746` | `status` | `['intervention-required']` | same |
| 4 | ⭐ **Close to Distinguished** | `ClubsTable.tsx:750–781` | `membersNeeded` | `[1, 4]` (`CLOSE_TO_DISTINGUISHED_MAX_MEMBERS`) | independent toggle, but writes the same field as #5 |
| 5 | **Needs members** | `ClubsTable.tsx:784–804` | `membersNeeded` | `[2, null]` (≥2) | independent toggle, but writes the same field as #4 |
| 6 | **Missing renewals** | `ClubsTable.tsx:807–846` | `octoberRenewals` | `[0, 0]` | independent toggle |
| 7 | **President's tier only** | `ClubsTable.tsx:849–885` | `distinguished` | `['President']` | independent toggle |
| 8 | **Clear all (N)** | `ClubsTable.tsx:887–895` | — | resets all filters | only present when `hasActiveFilters` |

Counts on chips 1–3 are derived once from `clubs` (memoized,
`ClubsTable.tsx:360–369`); chips 4–7 do not show counts.

### 1.2 What each chip filters

- **Health bands (1–3)** filter `currentStatus` — the derived health label
  produced by the analytics core. Single-select within the trio (line 348). "All"
  is the absence of an active band; the "Total / Showing N" line above
  (`ClubsTable.tsx:700–709`) is the only "all" affordance.
- **Close to Distinguished (4)** filters by `computeMembersToDistinguished`
  (qualification-aware, includes Goal 7/8 paths). The 4-member cap is shared
  with the `ClubDetailPage` banner. The chip's body comment
  (`ClubsTable.tsx:316–324`) flags that this is *not* fully equivalent to the
  banner's raw `gap.members` — a club can appear here without firing the banner
  and vice versa.
- **Needs members (5)** is `membersNeeded` ≥ 2 — clubs short by two or more.
  Overlaps **Close to Distinguished** on `[2, 4]`. They write the same field;
  clicking one replaces the other (`useColumnFilters` enforces last-write-wins).
- **Missing renewals (6)** is `octoberRenewals === 0`. **It does not cover
  April.** A club that paid October but missed April is *not* in this chip's
  scope.
- **President's tier only (7)** is `distinguished` includes literal
  `'President'`. The display name in `clubFilterDescribe.ts:39` is
  `"President's"`; this chip's label uses `"President's tier"`. There are no
  sibling chips for Distinguished / Select / Smedley.

### 1.3 Side effects and interactions

- **No hidden auto-sort.** The 2026-05-27 review (§1) flagged that the legacy
  "Close to Distinguished" chip silently re-sorted by `membersNeeded`. The body
  comment at `ClubsTable.tsx:755–758` confirms the consolidation removed that
  side effect — chips are pure filter writes now. ✅
- **Same state as the Filters drawer.** Every chip writes through `setFilter` to
  the same `useColumnFilters` state the Filters drawer (`FiltersPanel`,
  `ClubsTable.tsx:1136–1143`) and the active-filters bar (`ActiveFiltersBar`,
  `ClubsTable.tsx:903–909`) read. R11 — one mechanism, three entry points. ✅
- **Active-filters bar duplicates state.** When a chip is active, the user sees
  it announced in **four** places simultaneously:
  1. The chip itself shows `--active` styling and `aria-pressed=true`.
  2. The active-filters bar below the toolbar (`ActiveFiltersBar`) lists it as a
     removable summary chip.
  3. The Filters drawer trigger shows a numeric badge
     (`ClubsTable.tsx:682–686`).
  4. The count line flips from `Total: N` to `Showing N of M`
     (`ClubsTable.tsx:700–709`).
- **`membersNeeded` conflict is invisible.** Chips 4 and 5 read as independent
  toggles (no segmented grouping, no shared field cue). Activating #5 while #4
  is active silently un-toggles #4. No warning, no transition affordance.
- **Mobile (<768px).** The card view (`ClubsTable.tsx:984–1037`) still renders
  the whole quick-filter row above it. At 375px the row wraps to ~4 lines,
  pushing the first card ~120px down. The mobile sort dropdown (lines 988–1024)
  lives *below* the chip row, so the toolbar above the cards is
  Search → Filters → Columns → Quick-filter chip row → Sort dropdown — five
  controls before the first card.
- **Status redundancy with `ClubStatusBadge`.** The clubs themselves carry a
  `ClubStatusBadge` in the table body (Suspended / Ineligible / Low / Active).
  The Status quick-filter bands are *health* (Thriving / Vulnerable /
  Intervention), a different axis. The two semantically distinct "status"
  concepts use overlapping vocabulary, which is on-brand for Toastmasters but
  re-introduced into the same surface.

---

## 2. Critical findings

### F1 — The row mixes two selection models without telling the user

Bands 1–3 are a single-select segment of one population (their counts sum to the
table total). Chips 4–7 are independent toggles on orthogonal fields. They wear
the same affordance (`.clubs-quick-filter-chip` button, `aria-pressed`,
indistinguishable `--active` style), so the user can't predict which click will
replace a prior selection and which will compose. The body comment at
`ClubsTable.tsx:340–342` admits this consolidation was intentional ("a filter
toggles a set, it doesn't switch a panel") but the consolidation flattened away
the semantic distinction without replacing it with a visual one.

### F2 — Two chips fight over `membersNeeded`

#4 and #5 both write `membersNeeded`. Their ranges overlap on `[2, 4]`. They
present as parallel toggles; in practice they're mutually exclusive on a single
range slider. A user who clicks **Close to Distinguished**, then sees **Needs
members** also lights up the same population subset, will click it to "and"
them — and instead un-toggles the first chip. This is the canonical "two
controls writing the same store" anti-pattern.

### F3 — "Missing renewals" silently ignores April

The chip's label promises a renewal-state filter; its implementation is `October
== 0` only. From October–April a club that missed April is filtered *out*. The
spec is asymmetric without a label cue. This is the same shape as Lesson 115:
the field's name (and the chip's label) lies about which surface it covers.

### F4 — "President's tier only" is a singleton on a 5-value field

`distinguished` is a 5-tier categorical (`NotDistinguished`, `Distinguished`,
`Select`, `President`, `Smedley` — see `clubFilterDescribe.ts:36–42`). The chip
filters to one value. The word "only" makes it sound like a narrowing within a
selection that doesn't exist. The label "**President's tier**" is also slightly
wrong: in DCP vocabulary the achievement is "**President's Distinguished**" —
the same string the Filters drawer and the active-filters bar use
(`clubFilterDescribe.ts:39` → `"President's"`).

### F5 — Counts on bands, not on intents

Bands 1–3 carry a `<span class="clubs-quick-filter-chip__count">`; intents 4–7
don't. Scanning the row, the user reads three quantified options followed by
four unquantified ones. The cue inverts the chip's communicative role: counts
on bands make sense (segments of a population), but absence of counts on
intents removes the most useful preview ("how many clubs am I about to filter
to?"). Either show counts on all or on none.

### F6 — Four-way over-announcement of an active filter

Chip highlight + active-filters bar pill + Filters drawer badge + count-line
flip is one filter announced four ways. Visually noisy; cognitively, each
surface phrases it slightly differently (the chip says "President's tier
only", the bar says "Tier: President's", the badge says "1"). The user has to
reconcile them. The chip row was originally added because there was *no*
visible filter state; with the bar and drawer badge shipped (#817, #816) the
chip's `--active` state is now the redundant one.

### F7 — Label "Quick filters:" earns nothing

The text label at `ClubsTable.tsx:716` consumes a chip's worth of horizontal
space and tells the user something the chip shapes already say. On 375px it
displaces a chip onto the next line; on desktop it competes for attention with
the count line directly above it. A label that doesn't help the user pick
should be removed.

### F8 — Mobile: chip row before the cards is the wrong density

On a 375px phone the cards are one-at-a-time, scroll-paginated content. The
chip row currently consumes 3–4 lines above the first card, before the mobile
sort dropdown. Lesson 105 ("match the mobile-table pattern to the data's
purpose") applies: at this width the user wants one quick lens, not seven.
Either collapse the chip row into the Filters drawer on mobile (with the band
selection raised to a segmented strip), or show only the three health bands as
a compact segmented control.

### F9 — The semantic collision with `ClubStatusBadge`

Two "status" concepts on the same surface: health (the bands) and operational
status (Suspended / Ineligible / Low / Active, surfaced as `ClubStatusBadge`
in-row). The chip row uses the word *status* internally
(`filterStateToParams` writes `?status=…`); the badge column header is also
labelled "Club Status". This isn't a row-level bug, but the chip-row review is
the right place to note that **"Status" should not be a label on the chip row
at all** — call it what it is: Health.

---

## 3. Recommendations

Concrete, in order of effort. Each cites the file:line it touches and a brief
"why this is correct".

### R1 — Split the row into TWO regions with a visual divider

`ClubsTable.tsx:715–896` → one `<div class="clubs-quick-filters">`. Replace
with two sibling regions:

```
[ Health ▸ Thriving (124) · Vulnerable (38) · Intervention (12) ]
                          ── divider ──
[ ★ Close to Distinguished · Needs members · Missing renewals · President's Distinguished ]
```

- Region A renders the three health bands as a **segmented strip** (still
  single-select, still `aria-pressed`, but with a `role="group"`
  `aria-label="Health"` wrapper). Visual style: filled background at low
  opacity per status (green/amber/red).
- Region B renders the intent chips as **outline → fill** toggles.
- A thin vertical rule (or simply a gap + `border-left`) separates them.

**Why:** F1. Two selection models deserve two visual languages.

### R2 — Resolve `membersNeeded` conflict

Pick one (operator decides; recommendation marked):

- **(Recommended)** Drop **Needs members** (chip 5, `ClubsTable.tsx:784–804`).
  The drawer already exposes a numeric range filter for `membersNeeded`; users
  who want ≥2 (or ≥5) can set it precisely. The chip didn't carry a count, so
  the discoverability loss is minimal. Close-to-Distinguished is the high-value
  preset; Needs-members is a low-yield duplicate.
- OR fold both into a **3-state picker** ("Members needed: Any · 1–4 · 5+") as
  a single `aria-pressed`-style segmented chip. This costs more design but
  preserves both intents.

**Why:** F2. Two chips writing the same field is a category error.

### R3 — Rename and broaden "Missing renewals"

`ClubsTable.tsx:807–846`. Pick one:

- **(Recommended)** Rename to **Missing October renewals** (precise, no scope
  change).
- OR rewrite to test `octoberRenewals === 0 || aprilRenewals === 0`, label
  **Missing any renewals**. Requires a new filter type or a derived field; not
  trivial.

**Why:** F3. The label is the contract; either fix the label or fix the filter.

### R4 — Rename **President's tier only** to **President's Distinguished**

`ClubsTable.tsx:885`. Use the canonical DCP achievement name (matches
`clubFilterDescribe.ts:39` and the rest of the surface). Drop "only" — it
implies a narrowing within a selection that doesn't exist.

**Why:** F4. Consistency with the active-filters bar; correct vocabulary.

### R5 — Show counts on every chip OR none

Pick one (recommendation: counts on all chips):

- **(Recommended)** Compute counts for chips 4–7 in the same memoized pass as
  `statusCounts` (`ClubsTable.tsx:360–369`). Append a `<span
  class="clubs-quick-filter-chip__count">` to chips 4–7. Counts preview impact
  before clicking.
- OR drop counts from chips 1–3 to match.

**Why:** F5. Inconsistent count-ness is worse than either choice.

### R6 — Drop the chip `--active` highlight; let the active-filters bar own
"on"

`ClubsTable.tsx:737–739` (and the four other chip-active class concatenations).
Keep `aria-pressed` for assistive tech, but drop the visible `--active`
background. The active-filters bar (`ActiveFiltersBar`,
`ClubsTable.tsx:903–909`) is the canonical visible state. The chip row becomes
a pure preset launcher; the bar shows what's on.

**Why:** F6. Single source of "this is on" beats four redundant ones.

### R7 — Remove the **"Quick filters:"** label

`ClubsTable.tsx:716`. The chip shapes already say "quick filter"; the toolbar
context above (Search, Filters, Columns) already establishes the filtering
neighbourhood. Reclaim the horizontal space.

**Why:** F7. A label that doesn't aid pick-decisions is noise.

### R8 — Mobile: collapse intents into the drawer; keep bands as a segmented
strip

`ClubsTable.tsx:266` (`useIsMobile(768)`). Inside the `isMobile` branch
(`ClubsTable.tsx:984–1037`), do not render the intent chips. Render only the
three-band segmented strip above the card list. The Filters drawer trigger
(already in the toolbar above) is the path to intent presets — and an
intent-preset list inside the drawer can carry counts and explanations the
chip row can't.

**Why:** F8 + Lesson 105. One quick lens at mobile; rich filtering one tap
away.

### R9 — Relabel the chip-row's leading semantics from "Status" to "Health"

Where the consolidation comment uses "health-band presets" already, the URL
param stays `?status=` (backward-compat). But:

- The active-filters bar pulls labels from `COLUMN_CONFIGS` via
  `clubFilterDescribe.ts:24–26`. Verify the `status` column's `label` is
  "Health" (not "Status") — if it's "Status", flip it.
- The chip-row's leading region (R1) gets an `aria-label="Health"`, not
  `aria-label="Status"`.
- Operator decision: rename the URL param `?status=` → `?health=` in a
  follow-up (breaking change for bookmarked URLs — out of scope here).

**Why:** F9. Two "status" concepts collide; rename the chips, not the badge.

### R10 — Move **Clear all (N)** out of the chip row

`ClubsTable.tsx:887–895`. The Clear-all chip currently lives at the end of the
chip strip, with the same shape as the presets. It belongs in the
active-filters bar (the bar already has its own Clear-all if `hasActiveFilters`
— check `ActiveFiltersBar.tsx`). Render it there only; drop it from the chip
row.

**Why:** Combines with R6. The chip row becomes "what you can turn on"; the
bar is "what's on, with a remove-all".

---

## 4. Proposed implementation epic(s)

Two options for the operator — a tight one and a fuller one. Each sprint is
sized to ship in one PR with a single ticked acceptance checklist.

### Option A — **Minimal cleanup** (1 epic, 3 sprints, ~2 days)

Ship the high-confidence, low-risk fixes; defer the structural split until
the operator wants it.

**Epic:** *Clubs quick-filter row — vocabulary + redundancy cleanup*

- **Sprint 1** — R3 (rename **Missing October renewals**) + R4 (rename
  **President's Distinguished**) + R7 (drop "Quick filters:" label). Pure
  copy/markup; touches `ClubsTable.tsx:716, 807–846, 849–885` and the matching
  test labels. **Acceptance:** updated labels render; tests pass; no behaviour
  change.
- **Sprint 2** — R2 (drop **Needs members**) + R5 (counts on every remaining
  chip). Touches `ClubsTable.tsx:360–369` (extend memoized counts) and removes
  the chip block at `ClubsTable.tsx:784–804`. **Acceptance:** four intent chips
  remain, each with a count.
- **Sprint 3** — R6 (drop chip `--active` background; keep `aria-pressed`) +
  R10 (move Clear-all into the active-filters bar). CSS-level change in
  `clubs-table.css`; bar already has the surface. **Acceptance:** active
  filters announced once visibly; chip row is preset-only.

### Option B — **Structural split** (1 epic, 5 sprints, ~4 days)

Everything in Option A + the two-region split (R1) + mobile collapse (R8) +
the Health rename (R9). Recommended if the operator wants the row to *feel*
right, not just read right.

**Epic:** *Clubs quick-filter row — split presets from health, collapse on
mobile*

- **Sprint 1** — same as Option A Sprint 1 (vocabulary).
- **Sprint 2** — same as Option A Sprint 2 (drop **Needs members**, add
  counts).
- **Sprint 3** — **R1: split into two regions with a divider.** Touches markup
  `ClubsTable.tsx:715–897` and CSS. Two `role="group"` regions. **Acceptance:**
  visual + axe + Playwright (resting + dark mode) confirm two regions
  rendered, single-select within bands enforced via DOM, intents independently
  toggle.
- **Sprint 4** — **R8: mobile collapse.** Inside `isMobile` branch, render only
  the segmented band strip; suppress intent chips. **Acceptance:** Playwright
  at 375px in both Chromium and WebKit (R-block per the bootstrap prompt)
  shows ≤2 lines of toolbar above the first card.
- **Sprint 5** — **R6 + R10 + R9 (Health relabel).** Combine the chip-active
  drop, Clear-all move, and Status→Health labelling. **Acceptance:**
  active-filters bar is the only visible "on" cue; aria-label is "Health";
  URL param compatibility intact (`?status=` still parses).

### What I am *not* recommending

- A full Filters-drawer redesign — out of scope; the chip row is the
  complaint.
- URL param rename (`?status=` → `?health=`) — breaks bookmarks; needs its
  own epic if pursued.
- Removing the chip row entirely — discoverability would regress; the Filters
  drawer is more powerful but less inviting.

---

## 5. Status

**No code changes; awaiting operator decision.** The next step is the
operator's: pick Option A, Option B, or a custom subset, and the chosen epic(s)
get filed against the clubs surface. Until that decision lands, the chip row
ships as-is on `main`.

# ADR-005: District subpage IA map + secondary route-nav

**Status**: Accepted
**Date**: 2026-05-26
**Issue**: #677 (epic #674)
**Supersedes**: the tabbed district page in `docs/design/club-redesign-2026-05/HANDOFF.md` and the half-committed IA from epic #571.

## Context

The UX audit (`tasks/district-page-ux-audit.md`, live screenshots in
`.routine-tmp/ux-audit/`) found the district detail page's problems are
**information-architecture, not styling**. Epic #571 retired the original tab
strip but only half-committed to routed subpages: it added `/clubs`,
`/divisions`, `/rankings` while leaving an everything-scroll at `/district/:id`
(~18,900px tall on mobile, ≈50 phone screens), a hub that is simultaneously a
narrative and a launchpad, and an "On this page" anchor rail (`DistrictAnchorToc`)
that is `display:none` below 1024px — so the device class that needs jump-nav
most has none.

**Ron's decision (2026-05-24): no client-side tabs.** Tabs collapse multiple
views onto one URL, breaking the back button, deep links, and per-view
filter/sort state (the same race Lesson 070 documents for URL-encoded filters
only exists because filters live in the URL — a tab would throw that away
entirely). The fix is to commit fully to **real routed subpages** with a
persistent secondary nav of `<Link>`s — it looks tab-ish, but every item is a
route.

This ADR locks the route map and settles the three sub-decisions the audit left
open, because Sprints 4–6 (#678 nav primitive, #679 lean hub, #680 promote
Trends/Analytics) all build against these answers.

## Decision

### 1. Route map (final)

| Route                     | Content                                                                                                                                                             | Status after this epic                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `/district/:id`           | **Lean Overview hub** — KPI strip, Distinguished status, composition cards, anniversaries/milestones, and _top-5 preview_ lists that link out. Short and scannable. | reshape (#679)                                                 |
| `/district/:id/clubs`     | Clubs table                                                                                                                                                         | exists                                                         |
| `/district/:id/divisions` | Divisions & areas                                                                                                                                                   | exists — remove the duplicate inline section from the hub      |
| `/district/:id/rankings`  | Global rankings + "vs world"                                                                                                                                        | exists — move the inline "Vs world" block here                 |
| `/district/:id/trends`    | Membership + payment trend charts (3yr)                                                                                                                             | **NEW** (#680)                                                 |
| `/district/:id/analytics` | Top growth clubs + Top DCP achievers (full lists)                                                                                                                   | **NEW** (#680) — see decision 2                                |
| `/district/:id/club/:cid` | Club detail (leaf)                                                                                                                                                  | exists — keeps its hierarchical breadcrumb, **not** the subnav |

No new routes beyond `/trends` and `/analytics` are invented. Per Lesson 080, a
surface lives next to the data it consumes; both new routes lift content that
_already renders inline on the hub today_ onto their own addresses — they are
re-homing existing surfaces, not speculative pages.

### 2. Analytics gets its own route (not folded into the hub)

The full Top-Growth and Top-DCP-achiever lists live at `/district/:id/analytics`.
The hub carries only **top-5 previews** that link there.

**Why own-route over fold-into-hub:** the secondary nav (decision 3) lists an
"Analytics" item, and the load-bearing invariant of this whole epic is _every
nav item is a real route_. Folding Analytics into the hub would leave a nav item
with no destination — exactly the tab-like fiction the no-tabs decision rejects.
Own-route also gives the analytics lists their own shareable URL and filter
state (the same upgrade Clubs already has), and keeps the hub lean (the audit's
P0 complaint). The hub's top-5 previews are the teaser; the route is the full
list.

### 3. Secondary-nav primitive: a NEW component, distinct from the breadcrumb

Build a new `DistrictSubnav` (persistent links `Overview · Clubs · Divisions ·
Trends · Analytics · Rankings`, active-route highlight). **Do not** reuse the
`SubpageBreadcrumb` row (#615 / Lesson 085).

**Why not reuse the breadcrumb:** the two are different affordances with
different ARIA contracts, and conflating them overloads both.

- **Breadcrumb** = _vertical_ hierarchy ("where am I in the tree": `District 61 ›
Clubs`). `nav[aria-label="Breadcrumb"] > ol`, `aria-current="page"` on the
  **last** crumb. Lesson 085 deliberately makes it page-specific (the bare
  landing opts out).
- **Subnav** = _lateral_ view-switching ("jump to a sibling view"). A separate
  `nav[aria-label="District sections"] > ul` of links, `aria-current="page"` on
  the **active route**. It appears on the hub _and_ every flat sub-page — the
  opposite of the breadcrumb's landing-opt-out.

They coexist and complement: on `/district/:id/clubs` the breadcrumb answers
"back up to the district" and the subnav answers "across to Divisions." The
overlap (breadcrumb's "District 61" link ≈ subnav's "Overview" link) is
acceptable because the mental models differ; it is not the redundant-chrome
collision #442 removed (that was a crumb duplicating the _global_ nav tab on the
landing page — see Lesson 085). The leaf `ClubDetailPage` keeps its full
`District › Clubs › <club>` breadcrumb trail and does **not** get the subnav (it
is a leaf, not one of the sibling section views).

**Mobile primitive:** a horizontally-scrollable link row at all widths (handoff
§126), **not** a `<select>`. A select hides the sibling views behind a control
and adds a client-state intermediary; keeping the links visible and scrollable
preserves the "every item is a visible route" intent.

### 4. No sparkline teaser on the hub — the subnav's Trends link is the entry point

The hub does **not** keep a live trends sparkline. The Trends route is reached
via the subnav.

**Why:** a content-free "Trends →" card would just duplicate the subnav link
(the Lesson 085 redundant-chrome trap), so a teaser would only earn its place by
rendering an actual mini-chart — but a chart is the exact heavy, lazy-loaded,
CLS-/load-risk thing this IA is removing from the hub (and Sprint 1 #675 just
root-caused a charts-stuck-loading bug). The asymmetry with the top-5 _text_
previews (which we keep) is principled: text previews are cheap and glanceable;
a trend is only glanceable as a chart, and charts belong on `/trends`. If later
research shows demand for an at-a-glance trend on the hub, add it as a
deliberate follow-up with metric-matched CLS budget — not by default here.

### 5. Delete the "On this page" rail

`DistrictAnchorToc` (the right rail) is removed by the lean-hub sprint (#679).
The subnav replaces its wayfinding role and, unlike the rail, works at every
width.

## Consequences

**Easier:**

- Mobile wayfinding at every width (the rail was hidden < 1024px); each route is
  one short page instead of a 50-screen scroll.
- Back button, deep links, and per-view URL filter/sort state all keep working
  (the no-tabs payoff); Trends and Analytics gain their own shareable URLs.
- The hub becomes a lean, symmetric landing — no 200px empty gutter, no
  narrative/launchpad split-personality.
- Clear separation of concerns: breadcrumb = hierarchy, subnav = lateral nav.

**Harder / costs:**

- Two nav affordances on flat sub-pages (breadcrumb + subnav). Mitigated by their
  distinct ARIA roles and mental models; revisit only if usability testing flags
  it as noise.
- A new `DistrictSubnav` component to build, test, and keep active-route-aware
  across six routes (#678).
- `/analytics` and `/trends` need their own pages, data wiring, and URL state
  (#680) rather than riding the hub's existing hooks.

## Alternatives Considered

- **Keep client-side tabs** (the original handoff). Rejected 2026-05-24: breaks
  back button, deep links, per-view filter state.
- **Reuse `SubpageBreadcrumb` as the secondary nav.** Rejected: overloads a
  hierarchy affordance with lateral-switch semantics; wrong ARIA; the breadcrumb
  is intentionally landing-opt-out while the subnav must be landing-opt-in.
- **Fold Analytics into the hub (no `/analytics` route).** Rejected: leaves a
  subnav item with no route, violating the all-items-are-routes invariant, and
  re-bloats the hub the audit flagged as too long.
- **`<select>` mobile nav.** Rejected: hides sibling views behind a control.
- **Trends sparkline teaser on the hub.** Rejected: either redundant with the
  subnav link or reintroduces the heavy chart the IA is removing.

# Redesign Sprint Roadmap (Epic #352)

17 child issues grouped into 7 sprints. Each sprint = a coherent, releasable slice.

| #   | Sprint                                 | Issues                                                                                                                                       | Why this slice                                                                                     |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | **Foundation**                         | #353 tokens · #354 AppShell · #355 routing                                                                                                   | Unblocks everything. Existing pages render through new shell + tokens with zero visual regression. |
| 2   | **Districts leaderboard**              | #356 page · #357 Awards Race panel · #369 retire LandingPage (partial — only the landing route, leave dead components for the final cleanup) | First full visual replacement on a public route. High-signal demo.                                 |
| 3   | **District detail shell**              | #358 header · #359 tab bar                                                                                                                   | Wraps the existing tab content in the new chrome. Old tab content survives behind new tabs.        |
| 4   | **District detail tabs (high-volume)** | #360 Overview · #361 Clubs                                                                                                                   | The two tabs users hit most.                                                                       |
| 5   | **District detail tabs (rest)**        | #362 Divisions & Areas · #363 Trends · #364 Analytics · #365 Global Rankings                                                                 | Finishes the District page redesign.                                                               |
| 6   | **Club detail page**                   | #366 club detail                                                                                                                             | Full page rebuild.                                                                                 |
| 7   | **New pages + cleanup**                | #367 History · #368 Methodology · #369 finish (kill orphaned components + product-spec update)                                               | Net-new IA + final dead-code sweep.                                                                |

## Operating cadence

- **One sprint at a time.** Pause for sign-off between sprints.
- **Per-issue PRs**, conventional commits, `(#N)` references.
- **TDD per Full DoD.** /simplify + /review (fresh-context Agent) before push.
- **Lessons** added per file in `tasks/lessons/<NNN>-slug.md` (or appended to `tasks/lessons.md`).
- **Live verify** after each PR merges to main.

## Risk callouts

- **Token migration (#353)** — large `tm-*` token surface across components. Strategy: add new tokens **alongside** the existing `tm-*` set, migrate page-by-page in sprints 2–6. Don't try to rip-and-replace `tm-*` in Sprint 1.
- **Routed sub-paths (#355)** — old `/districts/:id` was a single page with internal tab state. Need backward-compatible redirect to `/overview` so existing links don't 404.
- **AppShell (#354)** — current `Header` + `Navigation` components must be retired carefully (R8 — audit read+write paths).
- **Tab bar primitive (#359)** lives between Sprint 3 and Sprint 4: ship it inert in Sprint 3 (renders existing content), wire each tab to the new content in Sprints 4–5.
- **Dead-code cleanup (#369)** — split into a partial pass at end of Sprint 2 (kill `LandingPage.tsx` only) and a full sweep in Sprint 7.

## Out of scope (this epic)

- Awards page (Epic #370 — deferred)
- Notifications/help/avatar in top bar
- Regions and Awards "soon" nav stubs

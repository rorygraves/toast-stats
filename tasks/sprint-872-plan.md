# Sprint 2 (#872) — CC-7: real `<Link>` navigation for club & division cards

Epic #873 / audit `docs/design/mobile-ux-audit-2026-05-28.md` §CC-7.

## Problem

Club & division navigation uses `useNavigate(...)` / button `onClick`, not real
anchors. That blocks middle-click, ⌘/ctrl-click, "open in new tab", and mobile
long-press, and hides the destination from assistive tech. Both routes exist;
they're just unreachable from the obvious affordance as real links.

## Principle (ron-ux)

A control whose only job is to go to a URL must be a real `<a>`/`<Link>`. Mouse
convenience (whole-row click) may stay as an enhancement, but the semantic link
must exist so the four affordances above work.

## Surfaces (one coherent concern)

1. **ClubCard** (mobile clubs, `DistrictClubsPage`) — `<button onClick>` →
   whole card is `<Link to state>`.
2. **ClubsTable desktop rows** (`DistrictClubsPage`) — club-name cell becomes a
   real `<Link>` (via table `meta`); whole-row onClick kept as mouse
   convenience, name link `stopPropagation` to avoid double-nav.
3. **ClubMiniList** (mobile mini, Division/Area pages — explicitly flagged
   "<Link> conversion is CC-7 / Sprint 2" in its header) — `<button onClick>` →
   `<Link>`.
4. **DivisionPage / AreaPage desktop club mini-tables** — club-name cell →
   `<Link>` (same row-convenience pattern as #2), for parity with #3.
5. **DivisionSummary** ("Division A" heading on the division performance card) →
   `<Link>` to `/district/:id/division/:divId`.

## State to preserve

`DistrictClubsPage` club links must carry `state={{ fromClubsSearch:
location.search }}` — `ClubDetailPage` reads it to round-trip the breadcrumb
back to the filtered list (#577). Division/Area-page club links pass no state
(parity with current behaviour).

## TDD order

Per surface: Red (anchor/href assertion in `MemoryRouter`) → Green → refactor.
Existing renders gain a `MemoryRouter` wrapper (Link needs router context).

# Sprint 2 (#619) — Membership Trend chart + DCP Status panel re-skin

**Decision (ron-sa):** Re-skin the existing hand-rolled SVG to pixel-match
`club-reference.html`. Do NOT migrate to Recharts — blast radius 2 files,
preserves the proven program-year-day axis (`calculateProgramYearDay`/`dayToX`),
and R10's CSS-class dark-mode stroke swap (#8ec5e8) is cleaner than Recharts
stroke props. Data is already wired from Sprint 1; this is a fidelity pass.

## Files

- `frontend/src/pages/ClubDetailPage.tsx` — rewrite Membership Trend block
  (lines ~646-809) and `DCPProjectionCard` markup to reference structure.
- `frontend/src/styles/components/app-shell.css` — add club-prefixed panel +
  chart + dcp classes (`.club-trend-grid`, `.club-panel*`, `.chart-stats`,
  `.mem-chart .line/.area/.dot/.key-line/.grid`, `.dcp-tier-row`, `.dcp-cell`,
  `.gap-row`) with `[data-theme='dark']` overrides.
- `frontend/src/pages/__tests__/ClubDetailPage.test.tsx` — new + updated tests.

## Geometry (from reference)

viewBox 800×260, PT14 PR14 PB26 PL36 → innerW 750, innerH 220.
xScale(day)=PL+(day/365)*innerW; yScale(y)=PT+(1-(y-yMin)/(yMax-yMin))*innerH.
yMin=max(0,min-4), yMax=max+4 (±4 padding replaces the `||1` inversion tripwire;
zero-range still yields an 8-unit centered window — no inversion).
4 y-ticks (i/3). Key verticals at days 0/92/275/365 labeled Jul 1/Oct 1/Apr 1/Jun 30.

## TDD steps

1. RED — assert: panel-meta "Program Year 2025–2026 · N data points"; chart-stats
   Base/Current/Change(signed + %); 4 key-date labels; `.club-trend-grid`;
   DCP "Outlook" label (was "Distinguished Outlook"); 4 gap tiers; met-row class.
2. GREEN — rewrite JSX + add CSS.
3. Update the existing "Distinguished Outlook" assertion → "Outlook" (spec change,
   not pinning — reference label is "Outlook").
4. /simplify, review, full suite, lint, build.
5. PR → CI → live verify on ts.taverns.red → label/tick/close per runner handshake.

## Preserve (R8)

- Provisional-distinguished handling in `DCPProjectionCard` (amber tint + "⚠
  Provisional"). Reference doesn't cover it but it's live logic — keep it.
- `<title>` tooltips + svg aria-label for a11y / axe.

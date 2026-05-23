# Club Page Redesign — 2026-05

Source: Claude Design handoff bundle, fetched 2026-05-23 from `claude.ai/design`.

## Files

- **`HANDOFF.md`** — full handoff README from the design assistant (5 screens, design tokens, behavior rules). Do not edit. Treat as upstream.
- **`club-reference.html`** — high-fidelity HTML prototype for the Club detail page. Pixel-perfect target.
- **`club-reference.png`** — full-page screenshot for at-a-glance reference.

## Decisions baked into the epic

- **Fidelity:** pixel-perfect (colors, spacing, gradients, shadows match `club-reference.html`).
- **Tokens:** legacy `--color-tm-*` family (the design's `--loyal-500` = `#004165` = our `--color-tm-loyal-500`).
- **Dark mode:** existing `[data-theme='dark']` scope (NOT `prefers-color-scheme`). Map the design's dark-mode CSS variables onto our existing dark-theme overrides.
- **Sprint order:** lands after #615 (breadcrumbs) and #616 (test infra) in META_EPIC #606.

## Out of scope (this epic)

The handoff bundle covers four other screens (Districts, District, History, Methodology). Those are potential future epics; not part of the Club redesign epic.

## Reference paths in chat / future agents

When implementing, agents should:

1. Read `HANDOFF.md` top-to-bottom for tokens, layout rules, behavior.
2. Read `club-reference.html` as the pixel-perfect target.
3. Map design tokens (`--loyal-500`, etc.) onto the codebase's existing `--color-tm-*` palette — do NOT introduce a new token namespace.

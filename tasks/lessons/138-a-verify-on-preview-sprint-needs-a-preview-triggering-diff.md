---
id: '138'
category: lesson
tags: [verification, automation, sprint-runner, ci, frontend, process]
auto_load: true
date: 2026-05-30
issues: [904, 900]
---

# Lesson 138 — A "verify on the PR preview" sprint needs a diff that actually triggers the preview

**Date:** 2026-05-30
**Issue:** #904 (epic #900 Sprint 4 — verify, document, capture lesson)
**PR:** [#954](https://github.com/taverns-red/toast-stats/pull/954)

## What happened

Sprint 4 was a pure verify-document-lesson sprint: the "Close to Distinguished"
preset already shipped in Sprints 1–3, so the only _deliverables_ were a
`docs/product-spec.md` update plus a lesson. But the acceptance criterion was
**"live-verified on the PR preview channel"** (Chromium + WebKit, 375/768/1280 +
dark mode).

The trap: `pr-preview.yml` is **path-filtered** to `frontend/**`,
`packages/{shared-contracts,analytics-core}/**`, and firebase config. A PR that
touches only `docs/**` and `tasks/lessons/**` deploys **no preview** — so there
is no live surface to drive, and the sprint's central acceptance criterion is
unmeetable by the very PR meant to satisfy it.

The resolution was not to fake it: the predicate's source-header comment cited a
**stale design-doc path** (an undated filename; the real doc is dated
`...-2026-05-28.md`), and `product-spec.md` had inherited the same stale path.
Correcting the comment in `frontend/src/utils/closeToDistinguished.ts` was a
genuine accuracy fix — and it made the diff touch `frontend/**`, so a real
preview (`pr-954-…web.app`) deployed and all 12 dual-engine smoke checks ran
against it. Verification: District 61 → "47 of 162 clubs need a nudge", single
🎯 chip, legacy quick-filter row gone, detail-card banner agreement confirmed.

## The transferable lesson

**When a sprint's acceptance is "verify on the PR preview," confirm up front
that the PR's diff will actually trigger the preview deploy.** A
verification/docs/lesson sprint naturally produces a docs-only diff, which on a
path-filtered preview workflow deploys nothing. Three honest options, in
preference order:

1. **Fold a real frontend change into the PR** — a genuine doc/comment accuracy
   fix in `frontend/**` (never a no-op edit to game the filter). Often there is
   a legitimate one hiding (here, the stale doc path).
2. **Verify against the predecessor's already-deployed preview** — the feature
   shipped on `main`; its last implementation PR's preview (or a fresh
   throwaway PR off `main`) is a valid live surface.
3. **Fall back to the local CORS-proxy build harness** ([[133-measure-a-multi-sprint-ux-delta-with-a-cors-proxy-and-per-build-served-dirs]])
   — build locally, proxy the CDN for CORS, drive with Playwright. The durable
   path when no preview exists at all.

## How to apply

- Before opening the PR for a verify-on-preview sprint, ask: "does this diff
  touch a preview-triggering path?" If not, decide which of the three options
  applies _before_ pushing, not after waiting for a preview that never comes.
- The smoke must be **layout-aware**: the clubs table de-tables to `ClubCard`
  (`[data-testid="club-card"]`) below 768px (Lesson 134), so a
  `table tbody tr` wait times out at 375px. Wait on `table tbody tr,
[data-testid="club-card"]` or on a toolbar element present in both layouts
  (the preset chip). The functional assertions still passed at desktop default
  viewports — only the responsive-screenshot wait was wrong, which is the tell
  that the _app_ is fine and the _harness selector_ isn't.

## Related

- [[133-measure-a-multi-sprint-ux-delta-with-a-cors-proxy-and-per-build-served-dirs]]
  — the local-build verification harness, the fallback when there's no preview.
- [[134-a-status-chip-in-an-overflowing-table-is-still-clipped-detable-the-row]]
  — why `table tbody tr` doesn't exist at mobile width.
- [[052-close-to-distinguished-dual-metric]] — the divergence this epic closed;
  the shared predicate is now the single source both surfaces consume.

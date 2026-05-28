---
id: '133'
category: lesson
tags: [verification, playwright, frontend, cls, tests]
auto_load: true
date: 2026-05-28
issues: [864, 865]
---

# Lesson 133 — To measure a before/after UX delta locally, proxy the prod CDN and give each git state its own served dir

**Date:** 2026-05-28
**Issue:** #864 (epic #865 Sprint 4 — verify the landing-page scroll-length drop)
**PR:** [#898](https://github.com/taverns-red/toast-stats/pull/898)

## What happened

Sprint 4 was a pure verification gate: prove the landing page `/` scroll length
dropped ≥60% at 375/414px in Chromium **and** WebKit after three earlier
sprints capped it. There is no deployed "before" — the baseline is a commit
(`de7cf5e3`, pre-#861). Two obstacles, both with reusable fixes:

1. **CORS blocks a local build from the prod CDN.** `vite preview` of a local
   build defaults `VITE_CDN_BASE_URL` to `https://cdn.taverns.red`, which
   returns 200 but **no `Access-Control-Allow-Origin`** for a `localhost`
   origin — so the SPA renders "Error Loading Rankings / Failed to fetch" and
   the page is ~1 viewport tall (a false "huge drop"). Fix: a ~20-line node
   `http` proxy that refetches the CDN path and adds `access-control-allow-origin: *`,
   then build **both** states with `VITE_CDN_BASE_URL=http://localhost:8899`.
   Same real prod data on both sides → apples-to-apples.

2. **`vite preview` serves `frontend/dist` live from disk.** Two preview
   servers on different ports both serve `frontend/dist`. Building the second
   git state (`npm run build:frontend`) **overwrites the dist the first server
   is still serving** — so the "after" server silently starts serving the
   "baseline" bundle. The tell was a Playwright run that showed 128 uncapped
   rows / 22,176px against the port I thought held the capped build. Fix: build
   each state into its **own** output dir (or re-measure each state immediately
   after its own build, before touching the other).

A third confound to rule out first: at a narrow viewport the desktop layout can
still render if `useIsMobile` (matchMedia `max-width:767`) resolves false. Here
it was a red herring — the "desktop at 375px" screenshots were just the
baseline bundle (which predates the mobile cap), not a media-query miss.

## The takeaway

A "verify the win" sprint on a CDN-backed SPA needs a measurement harness, not
just a smoke: **proxy the CDN for CORS, pin both git states to it, and isolate
each build's served files.** Then the durable artifact is a budget guard gated
on the capped state being active —
the caps are fed by a separately-resolving query, so a future un-cap silently
reverts the win unless a test holds the line. (See lessons
[107](107-a-deferred-async-insert-cls-source-reactivates-when-its-data-lands.md)
and [079](079-suspense-fallback-for-null-component-is-pure-cls.md).)

# Toast Stats — Live Site & Showcase Audit

**Date:** 2026-05-26
**Auditor:** Claude Code (applying PM, UX, Architect, Security, QE lenses)
**Scope:** Live site (`https://ts.taverns.red`, v2.17.0), the Claude design handoff (`docs/design/club-redesign-2026-05/HANDOFF.md`), and the stated secondary purpose: _advertise the quality of Red Taverns' work._
**Evidence:** Playwright captures of Districts / District-detail / Methodology / History at 1280/768/375px; rendered-DOM extraction; head + footer + routing source review. Artifacts in `.routine-tmp/site-audit/`.

---

## 0. The one-sentence finding

The **product** is portfolio-grade — but the site does **almost nothing to convert that quality into Red Taverns credibility**, and it is **invisible to the channels (link unfurls, search, social) through which a showcase actually reaches people.** The single thread tying these together: the only Red Taverns signal on the entire site is one non-clickable 12px footer phrase, and the site emits zero share/SEO metadata.

If the secondary purpose is "advertise Red Taverns," the site is currently a beautifully built shop with no sign over the door and a window nobody can photograph.

---

## 1. What's already working (don't touch)

- **District-detail page is genuinely impressive** — KPI strip with rank badges, distinguished-status "trophy case," composition donuts, anniversaries, milestones, longest-serving clubs. This is the strongest credibility asset on the site. It reads as "a serious team built this."
- **Mobile is clean and on-brand** — eyebrow → H1 → lede hierarchy, KPI cards, 44px-ish touch targets, no horizontal scroll at 375px. Honors the ecosystem's "95-year-old on a phone" principle.
- **Methodology page is thorough and honest** — data source, refresh cadence, Borda formula, DCP/health definitions, caveats, changelog. Transparency is itself a quality signal.
- **Implementation tracks the handoff closely** — token system, typography, layout, dark-mode toggle, routed sub-pages (`/district/93/clubs` etc.). Fidelity is high.

The raw material for a showcase is here. The gaps below are about **surfacing** it, not building it.

---

## 2. Findings by lens

### 2.1 Product Manager lens — positioning & the showcase job-to-be-done

The site serves audience #1 (district leaders) well. Audience #2 — _someone evaluating whether Red Taverns builds good software_ — has **no journey at all.**

- **F-PM1 (P0): No Red Taverns destination.** Footer says "A Red Taverns production" as plain text — no link. An impressed visitor cannot click through to learn who built it, see the other products, or make contact. The conversion path from "this is impressive" → "who is Red Taverns?" is a dead end.
- **F-PM2 (P1): The ecosystem moat is invisible.** Red Club, Speech Evaluator, Red Table, Tavern URL are never mentioned. Toast Stats has the most organically shareable artifact in the ecosystem (a district leader _wants_ to send their ranking to peers) — it should be the funnel's top of mouth, but it leaks every visitor.
- **F-PM3 (P2): No "why we built this / who it's for" framing.** The site opens straight into a 117-row table. Strong for the returning power user, but a first-time evaluator gets no narrative. A one-line credibility statement ("Built by Red Taverns — software for Toastmasters") near the chrome would do a lot.

**PM verdict:** The product is done; the _positioning layer_ is missing. This is a ~2–3 issue slice, not a rebuild.

### 2.2 UX Designer lens

Verified at 1280 / 768 / 375px. Dark mode exists via manual toggle (header).

- **F-UX1 (P1): Desktop landing is "table-first" with no above-the-fold orientation.** At 1280px the viewport is dominated by the ranking grid. The eyebrow/H1/lede are good but compete with a dense table immediately. A first-time visitor has to read to understand. (Mobile actually handles this better — the cards stack and breathe.)
- **F-UX2 (P2): "A Red Taverns production" is styled as legal fine print** (`--ink-3`, 12px) — i.e. visually de-prioritized exactly where the showcase value lives. If it becomes a link, it should also get a hair more visual weight (a pennant/wordmark, the `--rt-stats` amber accent).
- **F-UX3 (P2): No favicon-level brand polish for sharing/tabs.** Only `favicon.ico`; no `apple-touch-icon`, no themed PWA manifest. Pinned tabs / home-screen adds look generic — a small but real "is this a real product?" tell.
- **F-UX4 (note): `--rt-stats` amber (#D4873F) is wired (22 uses) but chrome is still legacy loyal-blue.** This is correct per Phase-2-blocked-on-ops#37 — flagged only so the showcase work doesn't accidentally pre-empt the rename.

### 2.3 Software Architect lens — discoverability & delivery

- **F-SA1 (P0): SPA with no SSR/prerender → crawlers and link-unfurlers see an empty shell.** The rendered `<title>` is still **"Toastmasters District Visualizer"** (the _old_ name, not "Toast Stats"), and there is **no `<meta name="description">`, no Open Graph, no Twitter Card, no `og:image`.** Consequences:
  - Sharing the link in Slack / LinkedIn / X / iMessage yields a bare URL with a stale, off-brand title and no preview. For a site whose whole secondary job is "get shared and look impressive," this is the single highest-leverage defect.
  - Google/Bing index a contentless shell. Organic discovery ≈ 0.
- **F-SA2 (P1): No `robots.txt`, no `sitemap.xml`** (`frontend/public/` contains only `favicon.ico`).
- **F-SA3 (P1): Title is unmanaged per-route.** Every page reports `<title>Toastmasters District Visualizer`. Deep links (a specific district) share identically and badly. Needs a lightweight head manager (`react-helmet-async` or a tiny `useDocumentTitle` hook) — district pages can self-title ("District 93 — Toast Stats").
- **F-SA4 (decision needed): static prerender vs. client-only meta.** Cheapest correct fix = bake static OG/description into `index.html` (covers the share-the-homepage case, which is 90% of showcase value) **plus** per-route titles client-side. Full per-district unfurls need prerendering (e.g. `vite-plugin-prerender`, a prerender step in CI, or Firebase's dynamic-rendering) — propose as a fast-follow, not a blocker.

### 2.4 Security lens

- **F-SEC1 (good): footer external links use `rel="noopener noreferrer" target="_blank"`** — correct. Any new ecosystem/About links must do the same.
- **F-SEC2 (P2): no Content-Security-Policy / security headers observed** for a public marketing surface. A CSP + `X-Content-Type-Options`/`Referrer-Policy` set (via Firebase Hosting `headers`) is a low-cost credibility + safety signal — security-conscious evaluators check. Google Fonts is currently third-party (the handoff itself recommends self-hosting "for performance and privacy"); CSP and self-hosting pair well.
- **F-SEC3 (note): data is public, read-only, no auth surface** — so the threat model is thin. The main risk is reputational (defacement-via-XSS on a showcase). CSP mitigates. No secrets exposure found in the client bundle paths reviewed.
- **F-SEC4 (P2): an `og:image` is an asset you serve** — generate it deterministically (no user input) to avoid an injection vector; a static branded card is safest.

### 2.5 Quality Engineer lens

- **F-QE1 (P1): meta/share/title behavior is completely untested** — because it doesn't exist. Whatever lands here needs tests, or it will silently rot (the title already drifted to the _previous_ product name without anyone noticing).
- **F-QE2 (P1): add a Lighthouse SEO + best-practices gate.** A Lighthouse CI step already exists for CLS (PR #595 history). Extend the budget to assert: has-description, has-title, valid-canonical, OG present. This makes "showcase metadata" a regression-protected invariant, not a one-time fix.
- **F-QE3 (P2): version drift** — footer reports **v2.17.0** live while spec/handoff docs reference v3.4.1. Likely just doc staleness, but worth a `docs/product-spec.md` reconcile so the "source of truth" stays trustworthy (itself a quality signal).
- **F-QE4 (note): no assertion-pinning risk in proposed work** — all new tests assert new, correct behavior.

---

## 3. Handoff fidelity check

The live site implements the 5-screen handoff faithfully (tokens, typography, layout, routed sub-pages, dark mode). **The handoff is product-scoped — it contains no marketing/showcase surface at all.** So the showcase gap is not an implementation miss against the spec; it's a **gap in the spec itself.** Recommendation: treat "Red Taverns showcase layer" (About surface + ecosystem links + share/SEO metadata) as a **net-new mini-spec**, not a handoff regression.

---

## 4. Prioritized recommendations

**P0 — do first, highest leverage, small effort**

1. **Fix share + SEO metadata in `index.html`** (F-SA1): correct `<title>` → "Toast Stats — Toastmasters District Performance"; add `meta description`, full Open Graph + Twitter Card set, `og:image`, canonical. _This is the single highest-ROI change for the showcase purpose._
2. **Make "A Red Taverns production" a real link** (F-PM1): link footer attribution → `https://taverns.red` (or the relevant landing), `rel="noopener"`. Smallest possible step that opens the conversion path.

**P1 — strong follow-ups**

3. **Per-route document titles** (F-SA3): tiny `useDocumentTitle` hook or `react-helmet-async`; district/club pages self-title.
4. **Ecosystem cross-links** (F-PM2): a small "Part of Red Taverns" footer block or an `/about` micro-page listing the 5 products with their accent colors and links. Turns leak into funnel.
5. **`robots.txt` + `sitemap.xml`** (F-SA2) in `frontend/public/`.
6. **Lighthouse SEO/best-practices gate + meta tests** (F-QE1, F-QE2): lock the fixes in.

**P2 — polish & hardening**

7. Above-the-fold orientation strip on desktop Districts (F-UX1).
8. Brand-weighted, linked attribution + `--rt-stats` accent (F-UX2).
9. `apple-touch-icon` + PWA manifest + branded `og:image` card (F-UX3, F-SEC4).
10. Security headers / CSP via Firebase Hosting `headers`; consider self-hosting fonts (F-SEC2).
11. Reconcile version drift in docs (F-QE3).
12. **Fast-follow decision:** per-district prerendering for rich deep-link unfurls (F-SA4).

---

## 5. Suggested issue breakdown (issue-driven, per manifesto)

- **Issue A (P0) — [#778](https://github.com/taverns-red/toast-stats/issues/778):** `feat(seo): static share + SEO metadata in index.html` — title, description, OG/Twitter, og:image, canonical. + Lighthouse SEO assertions. (1 file + CI; small)
- **Issue B (P0) — [#779](https://github.com/taverns-red/toast-stats/issues/779):** `feat(brand): link footer Red Taverns attribution` — footer becomes a link; add tests. (1–2 files; trivial)
- **Issue C (P1) — [#780](https://github.com/taverns-red/toast-stats/issues/780):** `feat(seo): per-route document titles` — head manager + per-page titles + tests.
- **Issue D (P1) — [#781](https://github.com/taverns-red/toast-stats/issues/781):** `feat(brand): Red Taverns ecosystem block / about micro-surface` — needs a small PM/UX spec first (which products, copy, links, where it lives). _This one warrants a design decision before building._
- **Issue E (P1) — [#782](https://github.com/taverns-red/toast-stats/issues/782):** `chore(seo): robots.txt + sitemap.xml`.
- **Issue F (P2) — [#783](https://github.com/taverns-red/toast-stats/issues/783):** `chore(security): Firebase Hosting security headers + CSP` (+ optional font self-hosting).

Issues A, B, C, E are well-specified and TDD-able immediately. Issue D needs a product decision (and may intersect the pending Toast Stats → Tally rename, ops#37) — recommend scoping it after A/B ship the quick wins.

---

## 6. Open questions for Ron

1. **Rename coupling:** the showcase/About work touches branding — should any of it wait for the Toast Stats → Tally decision (ops#37), or ship now on the current name and re-skin in the Phase 2 PR?
2. **About destination:** link attribution to `taverns.red` (portal — is it live?), the GitHub org, or a new in-app `/about`?
3. **og:image:** do you want a branded share card designed (Canva is available), or a clean typographic auto-card to start?

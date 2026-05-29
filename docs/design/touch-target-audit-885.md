# Touch-Target Audit — Epic G Sprint 1 (#885)

**Epic:** [#888](https://github.com/taverns-red/toast-stats/issues/888) — _"every
interactive element on every routed page hits 44 × 44 px in Chromium + WebKit."_
**Sprint 1 scope:** audit only — no product code change. Output (failing
selectors + per-engine screenshots) drives Sprint 2 (#886, fix) and Sprint 3
(#887, dual-engine tripwire).
**Source brief:** `docs/design/mobile-ux-audit-2026-05-28.md` §CC-6.

## Method

`frontend/e2e/touch-target-audit-885.smoke.ts` (a one-shot harness, deleted from
the branch after this audit ships) drove **15 routes** — one concrete instance
of every route shape in `App.tsx` — at **375 × 812 px** in **both engines**
(`smoke` = Chromium, `webkit` = Safari/WebKit). On each route it queried every
interactive element using the **same selector set as the product's own**
`getAllInteractiveElements` (`frontend/src/utils/touchTargetUtils.ts`), so the
audit and the app cannot drift, and flagged any rendered, visible element whose
`getBoundingClientRect()` measured **< 44 px in either dimension**.

Discipline applied (per Lessons 111 / 134 / 108):

- **Both engines** — a native `<select>` ignores `min-height` in WebKit (L111);
  measuring only Chromium is blind to iOS Safari. _(This run: the two engines
  agreed on every finding — the chip-selects are `opacity:0` overlays already
  sized to the visible chip, so the WebKit native-sizing trap doesn't apply
  here. Sprint 2 must re-verify in both engines after it changes the markup.)_
- **Geometry, not `toBeVisible`** (L134) — `toBeVisible` is true for off-screen
  elements; we assert measured box dimensions.
- **Direct `page.goto` per route** (L134) — no in-app nav, so no prior page's
  nodes linger mid-transition.
- **Measured after `document.fonts.ready`** (L134) — display-font reflow settled
  before measuring text-driven controls.
- **WCAG 2.5.5 inline-text-link exception** — inline `<a>` in flowing prose
  (`display:inline`, no button-like class/role) is recorded separately and is
  **not** counted as a headline failure. Epic G targets `<select>`, `<button>`,
  chips, and link-as-button.

Screenshots (failures outlined **red**, exempt inline links **amber**),
full-page, both engines: `/tmp/touch-target-audit-885/{chromium,webkit}/NN-route.png`
(30 PNGs, surfaced on the PR). Raw per-route findings: sibling `*.json`.

## Result summary

| Route                        | Real sub-44 px targets | Defect family |
| ---------------------------- | ---------------------- | ------------- |
| `/` landing                  | **17**                 | A + B         |
| `/district/61`               | 2                      | A             |
| `/district/61/clubs`         | 2                      | A             |
| `/district/61/divisions`     | 2                      | A             |
| `/district/61/rankings`      | 2                      | A             |
| `/district/61/trends`        | 2                      | A             |
| `/district/61/analytics`     | 2                      | A             |
| `/district/61/changes`       | 2                      | A             |
| `/district/61/division/A`    | 0                      | —             |
| `/district/61/club/01479548` | 0                      | —             |
| `/history`                   | 0                      | —             |
| `/methodology`               | 0                      | —             |
| `/awards`                    | 0                      | —             |
| `/regions`                   | **14**                 | C             |
| `/region/1`                  | 0                      | —             |

**45 unique failing element instances**, all reducing to **three component-level
defect families**. Findings were identical in Chromium and WebKit.

## Defect families (the Sprint 2 work-list)

### Family A — chip `<select>` overlays are 30–34 px tall

The program-year / snapshot-date "chip" controls are a visible styled chip with
an `opacity:0` native `<select>` overlaid (`select.absolute.inset-0.opacity-0`).
The **overlay is the touch target**, and it is sized to the chip's text height,
not the 44 px floor.

| `data-testid`              | Appears on                                                     | Measured (W × H) |
| -------------------------- | -------------------------------------------------------------- | ---------------- |
| `py-chip-select`           | landing + all 6 district subpages + overview                   | 107 × **30**     |
| `date-chip-select`         | landing + overview + clubs/divisions/rankings/trends/analytics | 104–115 × **30** |
| `changes-from-chip-select` | `/district/:id/changes`                                        | 149 × **34**     |
| `changes-to-chip-select`   | `/district/:id/changes`                                        | 135 × **34**     |

Selector: `select.absolute.inset-0.opacity-0[data-testid$="-chip-select"]`.
Height is the failing dimension (30–34 px < 44). **This is the dominant,
cross-cutting failure — it rides on shared toolbar chrome and appears on 8 of
15 routes.** Fix once at the shared `ChipSelect` component.
**Sprint-2 pointer:** give the overlay `min-height: 44px`; per Lesson 111, if the
fix ever exposes the native control add `appearance: none` and re-verify in
WebKit. Verify the overlay box, not the visible chip (L108/L134).

### Family B — landing region-filter chips are 36 px wide

`button.districts-toolbar__region-chip` (the "All / 01 … 14" region filter row on
the landing toolbar). 15 buttons: the numbered chips measure **36 × 44** (width
short); the "All" chip **42 × 44**. Height is fine; **width** is the failing
dimension. `aria-label` = `Region NN`.
**Sprint-2 pointer:** `min-width: 44px` (and reconcile horizontal padding so the
single-digit "01" chip still centres).

### Family C — `/regions` finder chips are 40–41 px wide

`button.region-finder__chip` (the region picker on `RegionsPage`). 14 buttons,
**40–41 × 44** — same width-short shape as Family B, different component.
`aria-label` = `Region NN`.
**Sprint-2 pointer:** `min-width: 44px`. Families B and C are the same defect in
two components; consider whether a shared chip token/utility is warranted (R6 —
confirm real overlap before extracting).

## Clean routes

`/district/:id/division/:divId`, `/district/:id/club/:clubId`, `/history`,
`/methodology`, `/awards`, `/region/:n` had **zero** sub-44 px interactive
targets (their interactive elements are full-width links/buttons or the
already-compliant `DistrictSubnav` scroll row — the one mobile-shaped nav
primitive per audit §CC-5). Inline prose links on these pages are WCAG-exempt and
recorded in the JSON but not counted.

## Notes / limitations

- **One instance per route shape.** District 61 / club 01479548 / division A /
  region 1 are representative; a different district could surface a control these
  instances don't render. The three defect families are component-level, so a
  Sprint-2 fix at the component fixes every instance regardless of params.
- **No desktop-regression risk this sprint** — audit only, zero product code
  changed.
- **The harness is deleted on ship.** Sprint 3 (#887) builds the _permanent_
  dual-engine 44 px tripwire; this file was a one-shot capture tool.

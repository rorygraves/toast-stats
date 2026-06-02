# Spike #1063 — TM District "Daily Reports" ingest: feasibility, contract, keep/EXCLUDE map + privacy

**Epic:** #1062 — Evaluate ingesting the 12 District Daily Reports
**Sprint:** 1 (spike, doc-only — no pipeline writes)
**Date:** 2026-06-01 · **District sampled:** D61, PY 2025-2026
**Status:** Recommendation ready for operator decision

---

## 1. TL;DR / recommendation

Ingestion is **feasible and low-risk**: the data API is anonymous, daily-fresh, and
parses with the same HTML-table shape the collector already handles. The full per-report
keep/EXCLUDE column map is **validated against live D61 fixtures** (see
`packages/collector-cli/src/__tests__/dailyReportsColumnMap.test.ts`, 30 assertions,
including a privacy backstop that goes red if any personal column is mis-classified as KEEP).

**Wire these (high value, clean privacy posture):**

| Priority | Report                                                         | New signal we don't have today                                                            |
| -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1        | **July / January Officer List Status**                         | Per-club officer-list submission — a **DCP prerequisite** we cannot verify per club today |
| 2        | **Education Achievements** → per-club award **counts by type** | De-identified award activity per club/area (names stripped)                               |
| 3        | **Club Success Plan Submission**                               | CSP **submission date** (we only carry a bool)                                            |
| 4        | **April / October Dues Renewal Status**                        | Per-club renewal status — **moves during closing**                                        |
| 5        | **New Clubs / Prospective Clubs**                              | The actual **lists** (we derive only counts); Prospective drops `Club Contact`            |

**Skip / defer:**

- **Triple Crown Awards** — the report has **no club column** and its only non-personal
  columns are per-member `Count`/`Award`; with `Member` excluded it collapses to a single
  **district-level count**. Low value, awkward shape. Defer (or ingest as one district scalar).
- **Club Coaches**, **New Club Sponsors and Mentors** — once names are stripped these are
  **presence/count only** (how many coaches/sponsors per club). Marginal value; defer to a
  later sprint if a "club has a coach" badge is ever wanted.
- **Educational Achievement Archive** — empty this PY (returns an empty body); ignore until
  a PY actually populates it.

**Two items need an operator decision before Sprint 2 builds anything — see §6.**

---

## 2. Verified API contract

Anonymous `GET`, no auth, no cookie. Returns rendered **HTML** (not JSON):

```
GET https://www.toastmasters.org/api/sitecore/DistrictReports/GetDistrictReport
      ?tableID=<report-GUID>&district=<D>&year=<PY>&sortBy=
```

- **Response shape:** a desktop `<table>` carrying the data, **followed by a
  `<div class="mobile-table">` that duplicates every row** (~5× the bytes). The parser must
  key off the `<table>` and ignore the mobile copy. (The committed fixtures keep the desktop
  table only — this is why the raw Education Achievements response is 2.5 MB but the fixture
  is 32 KB.)
- **Freshness:** each response carries `Reports are uploaded daily - Updated: <date> MT`.
  Sampled 2026-06-01 → `Updated: June 01, 2026`. Daily cadence confirmed for a single day;
  **cross-closing movement is NOT yet proven** (see §5).
- **`year` param:** in this sample, `year=2025-2026`, `year=2026`, and `year=2025` all
  returned byte-identical current-PY data. Treat `year` as **"current PY" only** until proven
  otherwise; do not assume arbitrary historical PYs are retrievable.
- **`sortBy`:** empty is accepted (default order). DataTables sorting/Export is **client-side
  only** — the HTML response IS the complete dataset; there is no separate authed download.
- **Empty reports** return a body with **no `<table>`** (Educational Achievement Archive
  returned 0 bytes). The parser must tolerate this without throwing.

### The 12 report-type GUIDs (full, verified from the D61 page)

| Report                           | tableID GUID                           | D61 rows (2025-26) |
| -------------------------------- | -------------------------------------- | ------------------ |
| April Dues Renewal Status        | `0235cdd5-ffee-4101-ab43-a952a2736fc0` | 160                |
| October Dues Renewal Status      | `0d56c054-0cd2-46ba-b3b1-3bf17221bd6c` | 160                |
| January Club Officer List Status | `43abeb51-40a6-4514-868a-d697d6481753` | 7                  |
| July Club Officer List Status    | `68d834ff-90c1-40ae-a79e-c9270bd9919c` | 160                |
| Club Success Plan Submission     | `99b20422-f82f-456b-8376-18d5ce1b70c5` | 160                |
| Education Achievements           | `c757d313-f815-4b22-93dc-b839d04cec7b` | 1,125              |
| Triple Crown Awards              | `b546ef04-e602-4ffc-95c5-5a786aba36b7` | 94                 |
| Educational Achievement Archive  | `a30b93f3-081e-42c8-9a36-137acb24be69` | 0 (empty)          |
| New Clubs                        | `ac6df5db-13de-425a-b8b9-f9c6093b538a` | 5                  |
| Prospective Clubs                | `50630d17-1492-40c9-8244-930b1d94167b` | 8                  |
| New Club Sponsors and Mentors    | `4da53bd8-f6d9-4fa5-81d8-34ed5966dddd` | 21                 |
| Club Coaches                     | `41955922-25ab-4a5a-8025-ebb7634f68bf` | 16                 |

To re-capture a fixture:

```bash
curl -s -A "Mozilla/5.0" \
  "https://www.toastmasters.org/api/sitecore/DistrictReports/GetDistrictReport?tableID=<GUID>&district=61&year=2025-2026&sortBy="
```

---

## 3. Per-report keep/EXCLUDE column map (validated)

Header order below is **exactly** as the live report emits it. `Name` is overloaded — in most
reports it is the **club** name (KEEP); in three people-listing reports the personal column is
named differently (`Member`, `Club Contact`, or a second `Name`) and is EXCLUDED. The map is
encoded as data in the validation test and proven exhaustive (every live header is classified
exactly once) and disjoint.

| Report                            | KEEP                                                                | EXCLUDE (personal)                              |
| --------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| April / October Dues Renewal      | Club, Division, Area, Renewal Status, **Name=club**, Location       | —                                               |
| Officer List Status (Jan/Jul)     | Club, Division, Area, List Status, Election, **Name=club**          | —                                               |
| Club Success Plan                 | Club Number, Division, Area, Submission Date, **Club Name**         | —                                               |
| **Education Achievements**        | Club, Division, Area, Award, Date, **Name=club**, Location          | **Member** (e.g. "Ricardo J. Bocanegra, DTM")   |
| **Triple Crown Awards**           | Count, Award                                                        | **Member** (e.g. "00987204 - Name unavailable") |
| New Clubs                         | Division, Area, Club, Charter Date, Status, **Name=club**, Location | —                                               |
| **Prospective Clubs**             | Division, Area, Club, Status, **Name=club**, Location, Prospect     | **Club Contact** (e.g. "Linda Brisebois")       |
| **New Club Sponsors and Mentors** | Club, Club Name, Charter Date, Code, Status                         | **Name** (e.g. "Louise Audy, PM5")              |
| **Club Coaches**                  | Club, Club Name, Code, Begin Date, Status                           | **Name** (e.g. "Rodica Jelea, VC1")             |

### Edge cases the parser must handle

- **Education Achievements — `Member` vs `Name`.** Both columns exist in the same row; `Member`
  is the person (EXCLUDE), `Name` is the club (KEEP). A blanket "drop Name" rule would wrongly
  drop the club and keep nothing useful. Classify per column, per report.
- **Triple Crown — `Member` is `"<memberId> - <name|Name unavailable>"`.** Even the rows that
  opted into "Name unavailable" still carry a **member ID number**, which is itself
  identifying. The whole `Member` column is excluded — you cannot keep "just the ID". And
  because the report has **no club/area/division column**, nothing per-club survives.
- **Multi-line / entity cells.** Award cells contain `&nbsp;` and embedded newlines
  (`EH5&nbsp;Engaging Humor Level 5,\nPM1…`); Prospective's `Prospect` cell concatenates
  multiple dated milestones. Normalise whitespace on parse.
- **Empty body** (Archive) → no `<table>` → return empty, do not throw.

---

## 4. Privacy assessment

**Hard rule (epic #1062): no individual personal name — or personal identifier — is ever
persisted.** The EXCLUDE map is applied at **parse time**, before any GCS/CDN write. What
remains is club/area/division-level, the same posture as today's published stats.

- **Education Achievements** de-identifies cleanly to **per-club / per-area award counts by
  award type** — a strong recognition signal with zero personal data. This is the recommended
  shape, **not** a member-level ledger.
- **Triple Crown** cannot be de-identified to anything per-club (no club column); only a
  district scalar count survives. Excluding `Member` is mandatory regardless.
- **Coaches / Sponsors-Mentors / Prospective** keep only club aggregates + status; the
  personal column (`Name` / `Club Contact`) is dropped.

The validation test enforces this two ways: an **exhaustiveness** check (the map can't silently
omit a header the report emits) and an independent **personal-value denylist** (no known
personal string may appear in any KEEP projection — this fails loudly if a future edit
re-classifies a personal column as KEEP, even though the header set would still "look" valid).

---

## 5. Closing-period augmentation — the strategic driver (evaluate, don't build yet)

The epic's real prize: these reports update **daily even during month-end closing**, when the
main `club-/division-/district-performance` dashboards freeze and date-remap (the #309 closing
logic). Overlaying daily-fresh report fields onto the frozen base would show district leaders
**current** reality for the things that actually move during closing.

**Premise not yet proven — this is the #1 risk to carry into Sprint 2.** A single-day capture
shows today's data is fresh, but cannot prove the reports _keep moving_ across a real closing
window. **Before building any overlay**, capture daily snapshots of (at minimum) Dues Renewal,
Officer List, CSP, New/Prospective Clubs across a month-end (e.g. June 28 → July 3) and diff
them. If they move while the base snapshot is frozen, the thesis holds.

**Overlay-eligible fields** (report-authoritative; everything else stays with the main
dashboard, esp. membership/payment _counts_):

- Dues renewal **status** (per club)
- Officer-list **status** + election type (per club)
- CSP **submission date**
- New-club **charter date / status**; prospective-club **status / milestones**

**Design constraints for the overlay (Sprint 2+):**

- **Explicit provenance.** A blended snapshot is _base (frozen) + overlay (daily reports)_.
  Every augmented field must carry its source + as-of date — never silently merge two cadences
  into one number (the multi-source hazard behind #800 and the D61 150→151 stale-prod incident).
- **Clean hand-off on un-freeze.** When closing ends and the base updates, the overlay must
  yield to the authoritative base without a value jumping backward.
- **Field-by-field eligibility only.** Counts the reports don't authoritatively cover are never
  overlaid.

---

## 6. Open questions for operator decision (gating Sprint 2)

1. **Republication licensing.** Anonymously _fetchable_ ≠ licensed to _republish_. The kept
   fields are club-aggregate (same posture as today's stats), and all personal columns are
   excluded specifically to preserve that posture — but this is TI's data. **Confirm
   republishing club-aggregate report fields is acceptable** before wiring ingest.
2. **Scope confirmation.** Proposed Sprint 2 = Officer List + Education Achievements (counts) +
   CSP + Dues Renewal + New/Prospective lists; defer Triple Crown, Coaches, Sponsors-Mentors.
   Confirm or re-prioritise.

---

## 7. Evidence / artifacts shipped this sprint

- `packages/collector-cli/src/__tests__/fixtures/daily-reports/` — 12 recorded D61 fixtures
  (desktop table only; trimmed for repo size, full shape + all edge cases preserved).
- `packages/collector-cli/src/__tests__/dailyReportsColumnMap.test.ts` — the validated map +
  30 assertions (exhaustiveness, disjointness, projection drops personal columns, personal-value
  denylist backstop, empty-body tolerance). Falsifiability confirmed: mis-classifying a personal
  column as KEEP turns the suite red.
- This doc.

No pipeline code changed; no personal data persisted.

# Sprint 3 (#1065) — ingest in-scope daily reports → de-identified per-district dataset

**Epic:** #1062. Storage = separate file + read-time overlay (Sprint 4 wires the overlay; this sprint just persists the dataset).

## Deliverables (TDD)

1. **shared-contracts** `district-reports.schema.ts` + types — Zod contract for the
   per-district dataset. Each section carries `sources: ReportSource[]`
   (`{reportType, tableId, asOf}`) for downstream provenance.
2. **collector-cli** `DailyReportParser` — add `extractReportAsOf(html)` (the
   "Updated: <date>" line). Pure; does not change Sprint-2 parse shape.
3. **collector-cli** `DistrictReportsBuilder.buildDistrictReports(input)` — pure.
   Routes parsed reports into sections; derives:
   - officer-list cadence join (Jan-present ⇒ semiannual; Jul-only ⇒ annual),
     `officerListSubmitted` = listStatus startsWith "Received".
   - coach `activeCoach` = status === 'PENDING'.
   - triple-crown district scalar `achieverCount` = number of achiever rows.
   - education = per-(club,award) counts (already aggregated by parser).
   - sponsors-mentors DEFERRED (#11) — skipped even if fetched.
4. **collector-cli** `DailyReportFetcher` — fetch in-scope report GUIDs per
   district over the anonymous reports API (injected `fetch`).
5. **collector-cli** `DistrictReportsWriter.write(...)` — schema-validate then
   write `snapshots/{date}/district_{id}_reports.json`. Additive new file →
   auto-promotes through the ADR-002 staging gate. NO base-snapshot mutation.

## Privacy (hard rule)

End-to-end guard: fixtures → parse → build → serialize → assert no PERSONAL_DENYLIST
value appears anywhere in the written JSON (L150-exhaustiveness: value-level backstop,
independent of the map).

## In scope (per sub-issue; overrides spike "defer")

Apr/Oct Dues · Officer Jan/Jul · CSP · Education (counts) · Triple Crown (scalar) ·
New Clubs · Prospective · Coaches. Deferred: Sponsors/Mentors.

---
id: '150'
category: lesson
tags: [data-pipeline, analytics, verification, scope, mcp, process]
auto_load: true
date: 2026-06-01
issues: [1044, 1042]
---

# Lesson 150 — An ADR/spec claim that a derived field "lives in the snapshot" can be false; verify the live payload before building a tool that promises it

**Date:** 2026-06-01
**Issue:** #1044 (epic #1042 Sprint 2 — read-only MCP tools over the CDN client)
**PR:** (this sprint)

## What happened

ADR-008's data-surface table lists **Club health status** as
`(per club, in snapshot)` with values `thriving / vulnerable /
intervention-required`, and the sprint sub-issue asked for a `get-club-health`
tool returning "club-health-status fields from the snapshot." But the binding
hard rule of the same ADR is **no computation, no `analytics-core` import,
never derive a tier/threshold/recognition state**.

Curling the live `snapshots/{date}/district_{id}.json` settled it: the club
records carry only the **raw inputs** — `membershipCount`, `membershipBase`,
`newMembers`, `dcpGoals`, `status`, `clubStatus` — and **no** `healthStatus`
field. The categorical enum is computed by `analytics-core` for the website; it
is **not** a served snapshot field. So the ADR table's "in snapshot" claim was
aspirational, describing the _conceptual_ corpus, not the _bytes on the CDN_.

The two requirements only reconcile one way: `get-club-health` surfaces the raw
health-signal fields (plus an explicit `note` that the categorical status is not
a snapshot field), and does **not** derive the enum. The "no computation"
constraint is the tiebreaker, not the table.

## The transferable principle

**A spec/ADR sentence that a _derived_ value is "already in" a data file is a
claim about the live payload — check it against the actual bytes before building
anything that promises it. When a hard constraint (here: no computation) and a
descriptive table conflict, the constraint wins, and the right move is to
surface the raw inputs the file genuinely carries, never to quietly recompute
the derived value to satisfy the table.** A `safeParse` against the read-schema
won't catch this — Zod object schemas strip unknowns and pass when the _required_
fields are present, so a missing _optional/derived_ field validates silently.

## How to apply

- Before wiring a "return field X" tool/feature, `curl --compressed` the real
  CDN/file and confirm X is actually present — don't trust the schema's
  _optional_ fields or a doc table. (Kin to R7 "inventory existing fields" and
  [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated]].)
- If X is derived and a constraint forbids deriving it, ship the raw inputs +
  a `note`, and record the doc discrepancy for an ADR follow-up rather than
  silently importing the compute path.
- Remember CDN snapshots are gzip-served: a bare `curl` shows binary; use
  `--compressed` (or the client's fetch) to read the JSON.

## Related

- [[115-a-fields-name-and-comment-can-lie-about-whether-its-populated]] — a
  field can be typed/named yet unpopulated in _your_ surface; same "verify the
  payload" reflex.
- `packages/mcp-server/src/tools/tools.ts` (`get-club-health`, the `note`),
  `packages/mcp-server/src/cdn/CdnClient.ts` (`getDistrictSnapshot`),
  `docs/architecture-decisions/008-ai-enable-toast-stats.md` (the table claim).

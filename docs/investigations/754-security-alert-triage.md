# Investigation #754 — Security & quality alert triage

**Epic:** #758 (Sprint 1 — triage; Sprint 2 #755 — remediate)
**Date:** 2026-05-26
**Author:** sprint-runner session (ron-sec persona)
**Scope:** Triage the 4 open GitHub "Security and quality" alerts. Establish
provenance + real-world exposure for each, and decide a remediation approach
per package for Sprint 2. **No code change in this sprint** — this is an
investigation deliverable; the proof is the recorded command output below.

---

## Alert inventory (open as of 2026-05-26)

| Source                | #   | GitHub sev | CVE sev (Trivy/NVD) | Package           | Installed | Patched |
| --------------------- | --- | ---------- | ------------------- | ----------------- | --------- | ------- |
| Dependabot            | 35  | medium     | medium              | uuid              | < 11.1.1  | 11.1.1  |
| Code scanning (Trivy) | 69  | high\*     | MEDIUM              | uuid              | 8.3.2     | 11.1.1  |
| Code scanning (Trivy) | 70  | high\*     | MEDIUM              | uuid              | 9.0.1     | 11.1.1  |
| Code scanning (Trivy) | 59  | low        | LOW                 | @tootallnate/once | 2.0.0     | 3.0.1   |

\* GitHub's code-scanning severity mapping inflates CVE-2026-41907 to "high".
The advisory text in the same alert says **MEDIUM**, and Dependabot agrees.
Treat it as **medium**.

Two distinct underlying issues: **uuid (CVE-2026-41907)** and
**@tootallnate/once (CVE-2026-3449)**.

---

## Finding 1 — uuid: real, CI/CLI-only, no patched line below 11.1.1

### Provenance (AC1)

`npm ls uuid --all` on a clean install (HEAD = origin/main):

```
toastmasters-district-visualizer@2.16.0
`-- @toastmasters/collector-cli@1.4.0 -> ./packages/collector-cli
  `-- @google-cloud/storage@7.19.0
    +-- gaxios@6.7.1
    | `-- uuid@9.0.1        <- code-scanning #70
    +-- teeny-request@9.0.0
    | `-- uuid@9.0.1        <- (same)
    `-- uuid@8.3.2          <- code-scanning #69 (direct GCS dep, "uuid": "^8.0.0")
```

**Every** uuid instance descends from `@google-cloud/storage@7.19.0`, which is
a dependency of **`@toastmasters/collector-cli` only**.

### Exposure classification: CI/CLI-only — NOT in the browser bundle

- `frontend/package.json` declares no `uuid`, `@google-cloud/*`, `*storage*`,
  or `collector-cli` dependency.
- `npm ls uuid -w frontend --all` → `(empty)`.
- The one `frontend/src` hit for "uuid" is `useBackfill.property.test.ts:67`
  calling **fast-check's `fc.uuid()` arbitrary** (a property-test generator),
  not the `uuid` package.
- collector-cli is the Node data-scraper that runs in **GitHub Actions** to
  build GCS snapshots. uuid reaches the runtime only on that CI/CLI path.

**Classification: transitive, CI/CLI-only, trusted execution context.** The
collector runs in CI against Toastmasters dashboard CSVs (not adversarial
internet input) and uses uuid to mint identifiers for GCS operations. The
public-facing surface (the React frontend) ships zero uuid. **Real-world
exposure is LOW** despite the inflated "high" label.

### Remediation constraint: no backport below 11.1.1

`npm view uuid versions` — the line jumps `9.0.1 → 10.0.0 → … → 11.1.1`. There
is **no 9.0.2 / 10.0.1 backport** of the CVE-2026-41907 fix. Remediation must
land **uuid 11.1.1**.

### Parent bump does NOT fix it

`@google-cloud/storage@latest` is **7.19.0** (= our current version), and it
still declares `"uuid": "^8.0.0"` + `"gaxios": "^6.0.2"`. `gaxios@7` dropped its
uuid dependency, but GCS 7.19.0 pins `gaxios ^6`, so we can't pull it in via a
GCS bump. **There is no parent version to bump to that removes the vulnerable
uuid.**

### Decision (AC3): `overrides` forcing `uuid: ^11.1.1`

`overrides` is the only viable path. Compatibility checked empirically:

- uuid@11.1.1 `exports` still ship a CommonJS entry —
  `"node": { "import": "…/esm/index.js", "require": "…/cjs/index.js" }`. The
  CJS consumers (gaxios, teeny-request, GCS all `require('uuid')`) resolve via
  the `require` condition, so the override is resolution-compatible.
- **Sprint 2 caveat (Lesson 100 — the tool is the contract):** uuid v7+ removed
  the _default_ export; named exports (`v1`, `v4`, …) are preserved. Sprint 2
  must run the collector-cli suite + a real scrape after applying the override
  to confirm no consumer relies on the removed default import. Do not assume
  from the changelog — run it.
- **Pattern precedent:** this repo already uses a nested override
  (`@google-cloud/storage → teeny-request → http-proxy-agent: ^7.0.0`, see
  Finding 2). Sprint 2 can mirror that shape (nested, scoped to GCS) or use a
  top-level `"uuid": "^11.1.1"` — nested is lower blast-radius and matches the
  established convention.

---

## Finding 2 — @tootallnate/once: ALREADY fixed; the Trivy alert is stale

### It is not in the current tree (AC2)

- `npm ls @tootallnate/once --all` → **not present**.
- `grep -c tootallnate package-lock.json` on HEAD → **0**.
- A clean `npm install` does **not** re-introduce it (the install produced only
  a 1-line, unrelated version bump; 0 package nodes added/removed).

### Why it's gone: a prior remediation already handled it

`git log -S '@tootallnate/once'` shows the last touch was commit **`f3d3b0cd`**
("fix: resolve all 4 Dependabot vulnerabilities", 2026-04-07, on main). That
commit added the still-present override:

```json
"@google-cloud/storage": { "teeny-request": { "http-proxy-agent": "^7.0.0" } }
```

`http-proxy-agent@7` dropped its `@tootallnate/once` dependency (the old
`http-proxy-agent@5` used it), so the package fell out of the tree.

### The alert is stale, not live

Code-scanning alert #59's most-recent-instance commit is `f14f95c5`
(created 2026-03-06), which **predates** the `f3d3b0cd` fix
(`git merge-base --is-ancestor f14f95c5 f3d3b0cd` → true). Trivy has not
re-scanned current main to clear it. (There is no open _Dependabot_ alert for
@tootallnate/once — Dependabot already dropped it; only the lagging Trivy
code-scanner #59 remains.)

### Decision (AC3): no dependency change needed

@tootallnate/once is already remediated in code. Sprint 2 action is **just to
clear the stale scanner state** — re-trigger the Trivy code-scanning workflow
against current main (it will auto-close #59), or dismiss #59 as "already
fixed" with a link to `f3d3b0cd`. No `overrides` / lockfile work required.

---

## Sprint 2 (#755) remediation plan summary

| #            | Package           | Action                                                                                                                                                                                 | Verify                                                                                                                            |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 35 / 69 / 70 | uuid              | Add override `uuid: ^11.1.1` (prefer nested under `@google-cloud/storage`, matching the http-proxy-agent precedent). Run `npm install`, confirm `npm ls uuid --all` shows only 11.1.1. | `npm run build:collector-cli` + collector-cli test suite + a smoke scrape; confirm alerts 35/69/70 auto-close after merge + scan. |
| 59           | @tootallnate/once | None (already fixed by `f3d3b0cd`). Re-run Trivy on current main or dismiss as stale.                                                                                                  | Confirm #59 closes on next scan.                                                                                                  |

**Out of scope (per epic #758):** secret scanning is disabled on the repo —
flag separately if desired, not part of this remediation.

---

## Evidence commands (reproducible)

```bash
npm ls uuid --all                         # provenance: all under GCS/collector-cli
npm ls uuid -w frontend --all             # (empty) — no frontend uuid
grep -c tootallnate package-lock.json     # 0 — already gone
npm view @google-cloud/storage@latest version dependencies.uuid dependencies.gaxios
npm view uuid@11.1.1 exports              # CJS require export present
git show f3d3b0cd --stat                  # the override that removed @tootallnate/once
gh api repos/taverns-red/toast-stats/code-scanning/alerts/59 \
  --jq '.most_recent_instance.commit_sha' # f14f95c5 (pre-fix → stale)
```

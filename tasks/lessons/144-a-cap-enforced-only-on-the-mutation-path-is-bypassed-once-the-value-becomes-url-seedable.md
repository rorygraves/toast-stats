---
id: '144'
category: lesson
tags: [router, react, frontend, scope, verification]
auto_load: true
date: 2026-05-30
issues: [978, 969]
---

# Lesson 144 — A cap (or any invariant) enforced only on the mutation path is bypassed the moment the value becomes URL-seedable

**Date:** 2026-05-30
**Issue:** #978 (epic #969 Sprint 2 — deep-link the landing-page controls) —
surfaced in fresh-context `/review`.

## What happened

Comparison pins moved from `useState<Set>` to a URL-synced string list
(`?pinned=12,34`, via `useUrlState`). The 3-pin cap (`MAX_PINNED`) was enforced
in `togglePin`:

```ts
setPinnedIds(prev =>
  prev.includes(id)
    ? prev.filter(x => x !== id)
    : prev.length < MAX_PINNED
      ? [...prev, id]
      : prev
)
```

That guard was complete **while the only way to add a pin was the button.** But
the same refactor made pins **URL-seedable** — and the inward parse had no cap.
A hand-edited / shared `/?pinned=1,2,3,4,5` seeded all five straight past the
guard, and `ComparisonPanel` (which only checks `< 2`, no upper bound) rendered
a five-district comparison. The button path was airtight; the new _seed_ path
was wide open. Unit tests were green because they only ever pinned via clicks —
the path that was already capped.

The fix puts the cap on the **parse**, the chokepoint every entry path flows
through, not on one writer:

```ts
const parsePinned = (v: string) => parseList(v).slice(0, MAX_PINNED)
```

## The principle

**When you make a piece of state URL-seedable, you add a new write path — the
URL — that bypasses every guard living on the old write path.** A cap, a
de-dup, a whitelist, a clamp that sat on the setter/handler is now only half the
fence: a typed or shared URL writes the value directly. Move the invariant to
where **all** entry paths converge — the parse / the owning page's read of the
param (R3) — so the typed URL, the shared link, the back button, and the button
click are all judged by the same rule. This is the same shape as Lesson 124
(validate a URL-synced range at the page, not the picker): the picker/handler
guards one path; the URL is the path that skips it.

## How to apply

- Promoting `useState` → `useUrlState`/`useSearchParams`? List every invariant
  the old setter enforced (cap, dedup, allowed-values, min/max, mutual
  exclusion) and re-assert each on the **parse**, because the URL is now an
  unguarded writer.
- Enumerate the invalid/abusive URL shapes explicitly (R17): too many items,
  unknown ids, duplicates, reversed ranges — a shared link is adversarial input,
  not just your own button's output.
- Add a deep-link test that **mounts at the abusive URL**, not just one that
  drives the control — the control path is the one already guarded.

## Related

- [[124-validate-url-synced-range-state-at-the-page-not-the-picker]] — same
  family: the constraint placed only on the input widget is bypassed by a
  hand-edited URL; validate where every entry path converges.
- [[070-setSearchParams-prev-races-in-batched-updates]] — sibling URL-state
  lesson from the same controls.
- `frontend/src/pages/DistrictsPage.tsx` (`parsePinned` / `PINNED_OPTS`).

---
name: IntersectionObserver callbacks must tolerate test-local mock shapes
description: Several DistrictDetailPage tests overload the global
  IntersectionObserver mock with their own setTimeout-based variant
  that fires entries WITHOUT a `target`. Production callbacks that
  read `entry.target.id` will throw asynchronously, polluting test
  output even when assertions pass. Guard with `entry.target?.id`.
type: feedback
---

# Lesson 72 — IntersectionObserver callbacks must tolerate test-local mock shapes

**Date:** 2026-05-22
**Issue:** #572 (District IA Phase 4 — sticky KPI bar + anchor TOC)

## What happened

The new `DistrictAnchorToc` (anchor TOC for the District narrative)
uses `IntersectionObserver` to highlight the section currently in
view. The repo's global JSDOM mock (in `src/__tests__/setup.ts`)
synchronously fires `[{ isIntersecting: true, target }]` on each
`observe(target)` call — `target` is the element my code passed in,
so `entry.target.id` is safe.

But several `DistrictDetailPage.*.test.tsx` files declare their own
per-test IntersectionObserver mock that does this instead:

```ts
setTimeout(() => {
  callback([{ isIntersecting: true } as IntersectionObserverEntry], this)
}, 0)
```

No `target` property. The deferred callback fires after the suite
has rendered the page (which now contains `DistrictAnchorToc`), my
callback iterates the entries, and `entry.target.id` throws
asynchronously. The error doesn't fail any test assertion — it
shows up as a separate "Unhandled Exception" line in vitest output,
8 times across the suite (once per affected test). Easy to miss in a
"6 passed (6)" header; loud once you read the error section.

## How to apply

**Guard the entry shape in IntersectionObserver callbacks** — defensive
coding against mock asymmetry, not against the spec:

```ts
new IntersectionObserver(entries => {
  for (const entry of entries) {
    const id = entry.target?.id
    if (!id) continue
    // …
  }
})
```

The `?.` is the production-correct fix even if the per-test mocks
were uniform, because the IntersectionObserver spec doesn't forbid
implementations from delivering placeholder entries during teardown.

**Don't rely on the global JSDOM mock matching every test's mock.**
When introducing IO-based code, grep for local `IntersectionObserver`
overrides under `src/**/__tests__/**`:

```bash
grep -rn 'class.*IntersectionObserver\|IntersectionObserver.*{' \
  src/**/__tests__/
```

Anything not matching `src/__tests__/setup.ts` is a local override
that may not pass a `target`. Guard accordingly.

## Telltale signs

- New `IntersectionObserver` consumer; integration tests start
  emitting "Cannot read properties of undefined (reading 'id')" /
  similar TypeErrors as **Unhandled Exceptions** (not test failures).
- Stack trace points at your callback line that reads `entry.target.…`.
- The same code passes its own `DistrictAnchorToc.test.tsx`-style
  unit test because that test uses the global mock, which does
  attach `target`.

## Why

`setup.ts` covers the common case. Per-file mocks were written by
authors who only cared about the `isIntersecting` flag for their own
chart / visibility tests. They don't know — and don't need to know —
about future consumers of IO. New IO consumers are the ones that need
to assume the worst about entry shape.

## Related

- `frontend/src/__tests__/setup.ts` — global mock that attaches `target`
- `frontend/src/pages/__tests__/DistrictDetailPage.AnalyticsTab.test.tsx`
  and `…TrendsTab.test.tsx` — per-file mocks that don't
- `frontend/src/components/DistrictAnchorToc.tsx` — the guarded callback

---
id: '120'
category: lesson
tags: [tests, vitest, flaky, react, frontend]
auto_load: true
date: 2026-05-27
issues: [780, 785]
---

# Lesson 120 — `await waitFor` for an already-flushed effect leaks a deferred render into the next test

**Date:** 2026-05-27
**Issue:** #780 (epic #785 Sprint 3 — per-route document titles)

## What happened

Adding a per-route `document.title` assertion to `ClubDetailPage.test.tsx`,
I reached for the reflexive async form:

```ts
it('self-titles the document', async () => {
  renderWithRoute()
  await waitFor(() => expect(document.title).toBe('… — Toast Stats'))
})
```

It made the title assertion pass — but a **later, unrelated** test in the same
file (`renders the chartered date segment`) started failing. That test injects
a one-shot mock:

```ts
vi.mocked(useDistrictAnalytics).mockReturnValueOnce({
  /* club w/ charterDate */
})
renderWithRoute()
```

The `mockReturnValueOnce` value was being consumed by a **deferred re-render
left over from my `waitFor` test** (the lazy-chart imports / async effects that
`waitFor`'s polling kept alive past the test body), so the chartered-date
render fell through to the default mock and the charter date never appeared.
On `origin/main` all 26 tests passed; my one `await waitFor` turned a green
file red two tests away.

## The transferable lesson

**When the value you're asserting is set by an effect that
`render()` already flushes inside `act()`, assert it synchronously — don't
reach for `await waitFor`.** `document.title` (and other effect-set globals)
are committed by the time `render()` returns under React Testing Library.
`waitFor` adds nothing there except a polling window that keeps the component's
async machinery (lazy imports, microtask re-renders) running _after your test
body returns_. That deferred work is what reaches into the next test and
consumes a queued `mockReturnValueOnce`. A synchronous `expect` ends the test
cleanly with nothing pending.

`mockReturnValueOnce` is the canary: it only returns its value for the _next_
call, so it is acutely sensitive to a stray render arriving from a prior test.
A leak that a persistent `mockReturnValue` would absorb silently, a
`…Once` surfaces as a confusing failure in a test you didn't touch.

## How to apply

- Effect-set global (`document.title`, a `data-*` attribute, a class on
  `<html>`) that `render()`/`act()` already flushed? Assert it **synchronously**
  right after render. Reserve `await waitFor`/`findBy*` for state that genuinely
  resolves later (network, debounce, real timers).
- A test fails "for no reason" two tests after one you edited? Suspect an
  async leak from the edited test, especially if the failing test uses
  `mockReturnValueOnce`. The trigger is almost always a `waitFor`/`findBy*`
  whose component kept rendering past the assertion.
- Prefer `mockReturnValue` over `mockReturnValueOnce` when a test only needs a
  stable return — it is leak-tolerant. Keep `…Once` for the rare case you are
  deliberately asserting call-sequence behaviour, and know it raises the
  isolation bar for every test that mounts the same component.

## Related

- [[053-renderwithproviders-bloat-as-contention-amplifier]] — sibling theme:
  test-harness side effects amplify into unrelated tests. There it was provider
  bloat under parallelism; here it is a `waitFor` keeping a render alive.
- `frontend/src/pages/__tests__/ClubDetailPage.test.tsx` — the synchronous
  title assertion, with a comment pinning _why_ it must not use `waitFor`.
- `frontend/src/hooks/useDocumentTitle.ts` — the hook under test.

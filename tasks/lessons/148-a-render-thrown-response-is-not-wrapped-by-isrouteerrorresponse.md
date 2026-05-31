---
id: '148'
category: lesson
tags: [router, react, frontend, verification, error-handling]
auto_load: true
date: 2026-05-31
issues: [1017, 1008]
---

# Lesson 148 — A render-thrown `Response` is NOT wrapped into an ErrorResponse; `isRouteErrorResponse` misses it

**Date:** 2026-05-31
**Issue:** #1017 (epic #1008 Sprint 3 — scoped Division/Area wayfinding + bad-slug 404)
**PR:** (this sprint)

## What happened

The scoped Division/Area pages had no slug validation: an unknown
`/district/61/division/ZZ` rendered an empty "no clubs" page instead of a 404.
The fix: once the divisions snapshot has loaded and no division/area matches,
`throw new Response(null, { status: 404 })` from the component render so it
bubbles to the root `errorElement` (the branded `ErrorPage`, #1011/#1012).

The throw reached the boundary fine — but `ErrorPage` rendered the **generic
"Something went wrong"** variant, not the branded **"Page not found"**. Its
gate was `is404 = isRouteErrorResponse(error) && error.status === 404`, and
`isRouteErrorResponse` returned **false** for the thrown Response.

## The transferable principle

**React Router (v6 data router) only wraps a `Response` thrown from a
_loader/action_ into the internal `ErrorResponse` that `isRouteErrorResponse`
recognizes. A `Response` thrown from a component _render_ arrives at
`useRouteError()` raw** — `isRouteErrorResponse(err)` is `false`, but
`err instanceof Response` is `true` and `err.status` is intact. An error
boundary that keys its 404 branch solely off `isRouteErrorResponse` therefore
misclassifies every render-thrown 404 as a generic runtime error.

Handle both shapes where you read the error:

```ts
const errorResponse = isRouteErrorResponse(error)
  ? error
  : error instanceof Response
    ? error
    : null
const is404 = errorResponse?.status === 404
```

The nested ternary (not `(a || b) ? error : null`) preserves type narrowing in
each branch without a cast — both `ErrorResponse` and `Response` expose
`status`/`statusText`.

## How to apply

- Validating a route param by throwing from render (vs. a loader)? The boundary
  must accept a raw `Response`, not just an `ErrorResponse`. Pin it with a test
  that mounts a child route which `throw`s the Response and asserts the **404
  variant**, not just that _a_ boundary rendered.
- Gate the throw on the data being **loaded**, never on emptiness: `if (snapshot
&& !entity) throw 404`. A real entity whose child rows are all suspended must
  still render (Lesson 147) — validity is membership in the snapshot's list, not
  a non-empty `allClubs`.
- The throw-to-`errorElement` path only exists in a **data router**
  (`createMemoryRouter`/`createBrowserRouter`). A `<MemoryRouter><Routes>` test
  harness can't catch it — mirror production: root route with `errorElement`,
  the page as a child.

## Related

- [[146-a-root-errorelement-renders-outside-the-app-context-providers]] — same
  branded `ErrorPage`; this is the sibling gotcha on how the error is _typed_.
- [[147-a-reused-parity-surface-must-render-from-its-own-data-source-not-be-gated-by-a-siblings-emptiness]]
  — why the 404 gate keys off the snapshot's division list, not `allClubs`.
- `frontend/src/components/ErrorPage.tsx`, `frontend/src/pages/{DivisionPage,AreaPage,AreaRedirectPage}.tsx`.

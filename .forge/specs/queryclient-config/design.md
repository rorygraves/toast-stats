# queryclient-config — Design

## Problem

The central TanStack Query client at `frontend/src/config/queryClient.ts`
hard-codes its configuration as inline literals inside the `QueryClient`
constructor (retry, refetch, stale/gc times, mutation retry). There is no
named, importable, testable representation of that configuration — the
values live only as anonymous numbers and booleans inside the constructor
call.

## Approach

Extract the QueryClient configuration into a single exported, typed
constant and build the client from it. Strictly behaviour-preserving: all
five values stay byte-identical, so no query or mutation behaviour
changes.

Within `frontend/src/config/queryClient.ts` only:

1. Add an exported named TypeScript interface describing the config shape.
2. Add an exported `const QUERY_CLIENT_CONFIG` of that interface type with
   fields:
   - `queryRetry = 1`
   - `refetchOnWindowFocus = false`
   - `staleTimeMs = 5 * 60 * 1000`
   - `gcTimeMs = 10 * 60 * 1000`
   - `mutationRetry = 0`
3. Construct the existing `queryClient` from `QUERY_CLIENT_CONFIG` so the
   `QueryClient` constructor contains no inline numeric literals.

Add one new test file `frontend/src/config/queryClient.test.ts` (vitest)
asserting the `QUERY_CLIENT_CONFIG` values and that
`queryClient.getDefaultOptions()` reflects them.

## Non-goals

- **No `cacheTimes.ts` / `CACHE_TIME` module.** That broader
  centralization idea is explicitly discarded.
- **No changes under `frontend/src/hooks/` or `frontend/src/components/`.**
  Their inline `staleTime`/`gcTime` values are left untouched.
- **No retuning** of any value — all five stay byte-identical.
- **No env-aware config, no Query Devtools.**

## Constraint

A firm acceptance criterion (per the human): every string literal in new
or changed code, including import statements, must use double-quote
characters.

## Verification

`npm run build:frontend` (typecheck + build) and `npm run test:frontend`
pass. The new test asserts the five config values and that the client's
default options reflect them. No numeric value changes, so behaviour is
unchanged.

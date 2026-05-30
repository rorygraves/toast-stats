---
id: '138'
category: principle
tags: [bash, automation, sprint-runner, shell]
auto_load: true
date: 2026-05-30
issues: [930, 933]
---

# Lesson 138 — A bash function that returns data via globals must be called as a statement, never in `$(...)`

**Date:** 2026-05-30
**Issue:** #930 (epic #933 Sprint 3 — liveness fusion verdict wired into the tick)
**PR:** _(record on merge)_

## What happened

`evaluate_liveness` sampled three probes and set `LIVENESS_VERDICT` /
`LIVENESS_COMMIT` / `LIVENESS_PROCESS` / `LIVENESS_LOG` as globals — the documented
contract being "read the breakdown from the globals after it returns." The tick
called it as `verdict=$(evaluate_liveness "$issue")`. Command substitution runs the
function in a **subshell**, so every global it assigned died with that subshell;
the parent's copies stayed empty. The verdict token (captured from stdout) was
correct, so the bug hid behind a green-looking log — but the diagnostic line
printed `[commit= process= log=]`, blank exactly where the observability lived.

The first integration test passed **vacuously**: it asserted only on the verdict
token (which travels via stdout and survives), never on the breakdown the globals
carried. A fresh-context review caught it; strengthening the test to assert
`commit=OK process=OK log=UNKNOWN` reproduced the failure before the fix.

## The principle

A function has exactly one stdout channel but any number of global side effects.
If it returns data through globals, you **must** invoke it as a plain statement
(`f args`) and read the globals afterward. The moment you wrap it in `$(...)`,
backticks, or a pipeline, it runs in a subshell and the globals never reach the
caller. Pick one return mechanism per function and make the call site match it:

- **stdout** → `x=$(f)` is correct; globals are unreliable.
- **globals** → `f; x=$GLOBAL` is correct; `$(f)` silently loses them.

## How to apply

- When a function sets globals, call it bare and document "results via globals —
  do NOT call in `$(...)`" at the definition (the subshell loss is invisible at
  the call site).
- Assert on the **global-carried** outputs in the test, not just the stdout
  return — a test that only checks the stdout value passes vacuously while the
  globals are empty. The richest field is the one most likely to be silently
  dropped.
- Prefer one mechanism. Mixing "echo the headline + globals for the detail" is
  what made this fail half-silently; if a function must expose several values,
  return them all the same way (all globals, or a single structured stdout line
  the caller parses).

Related: [[083-a-bash-exit-traps-return-value-becomes-the-scripts-exit-code]] (a
different "the obvious call form has a non-obvious side effect" bash trap).

---
id: '140'
category: principle
tags: [automation, sprint-runner, verification, tdd, bash]
auto_load: true
date: 2026-05-30
issues: [932, 933]
---

# Lesson 140 — A probe whose production feed was deferred reports UNKNOWN forever; the verification sprint is where you drive it end-to-end against the real feed

**Date:** 2026-05-30
**Issue:** #932 (epic #933 Sprint 5 — simulated-zombie verification)
**PR:** _(record on merge)_

## What happened

The liveness detector's headline target was the **#871 shape**: screen alive,
`claude` alive and _spinning CPU_ (a thinking-block loop), no commits, output
repeating. By design (§2.2) this shape is caught only by **two** soft probes
corroborating — commit-age STALL **and** log-repeat STALL — because the process
probe deliberately reads OK (CPU is non-zero, so it is neither idle nor a husk).

Sprints 2–4 built and unit-tested all three probes, the fusion truth table
(including "commit+log STALL → STUCK, the #871 shape"), and the
reap/relaunch/escalate machine. Every test was green. **But the log probe's
production feed was never wired.** `launch_sprint_session` ran `screen -dmS …
bash -c "claude …"`, sending claude's output only to screen's in-memory PTY —
nothing on disk. `evaluate_liveness` reads `RUNNER_LOG_DIR/session-<issue>.log`
_if present_, else UNKNOWN. So in **production** the #871 shape was:
`commit=STALL, process=OK, log=UNKNOWN` → exactly **one** STALL → **SUSPECT** →
**never reaped.** The detector's entire reason for existing — catch the #871
zombie — did not work, and nothing was red.

The unit tests didn't catch it because they feed the classifier
pre-sampled inputs; the hermetic tick tests that _did_ exist drove STUCK via
**HUSK** (process gone), which needs no logfile. The one mode that needs the log
feed was the one mode never driven end-to-end against the real host.

## The transferable principle

**A multi-signal detector is only as live as its least-wired feed — and a probe
whose feed was deferred reports its safe-default (here UNKNOWN) forever, silently
blinding the detector in exactly the case it was built for.** When a build is
sequenced "classifier first, host-wiring later," the deferral is a load-bearing
debt: every green unit test reads as "the detector works" when really only the
_pure_ half does. The verification sprint's job is precisely to close that gap —
drive each probe **end-to-end against the real production feed**, not re-run the
classifier with fixtures. The honest output of verification is often "we built
the brain but never connected this nerve," and wiring it is the deliverable, not
a surprise.

This is the inverse of [[136-a-flake-detector-must-not-inherit-the-stability-cap-it-measures]]:
there a detector was blinded by inheriting a _cap_; here by a _missing feed_.
Same failure family — **a detector that can't actually observe its target class
reports a reassuring null forever.** Corroboration designs (§2.2: "caught by the
_other two_ probes") are especially exposed: if one of the corroborating feeds is
dark, the AND-of-two silently degrades to a single signal that never fires.

## How to apply

- When a probe/signal/check is deferred ("wire the feed in a later sprint"),
  treat it as a tracked gap with the **headline failure mode attached** — "until
  this lands, mode X is undetectable" — not a footnote. Grep the impl for the
  safe-default token (`UNKNOWN`, `null`, `0`) the dark feed emits.
- A verification sprint drives the **real edge**, not the pure core. If your
  end-to-end test can pass without the production wiring existing (e.g. it
  fabricates the logfile the launcher was supposed to write), add a separate
  assertion that the **launcher actually creates the feed** — that is the
  assertion that goes red on the real gap. (Here: the relaunch's `screen` call
  must carry `-c <screenrc> -L` pointing at `session-<issue>.log`.)
- For any AND-of-N corroboration rule, enumerate what each input reads in
  production _today_. If any is structurally UNKNOWN, the rule's effective
  arity is N−1 (or it never fires). Fewer live signals than the design assumes
  is the bug.

## Related

- [[136-a-flake-detector-must-not-inherit-the-stability-cap-it-measures]] — same
  family: a detector blinded (there by a cap, here by a missing feed) reports a
  false green.
- [[135-a-coverage-gate-fails-a-filtered-subset-run-zero-thresholds-in-a-flake-harness]]
  — instrument vs. gate; preserve the signal, neutralize only what masks it.
- R20 (partition exhaustiveness — a file that falls out of every project runs
  nowhere, silently) — the same "silent gap in a measurement surface" shape.
- `scripts/sprint-runner.sh` (`launch_sprint_session` logfile wiring),
  `scripts/lib/sprint-runner-liveness.sh` (`evaluate_liveness` log sampling),
  `scripts/tests/sprint-runner-zombie-verify.test.sh` (the end-to-end driver).

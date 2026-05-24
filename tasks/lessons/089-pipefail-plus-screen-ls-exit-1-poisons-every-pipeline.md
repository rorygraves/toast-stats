---
id: '089'
category: principle
tags: [bash, screen, automation, ci]
auto_load: true
date: 2026-05-23
issues: [633, 634]
---

# Lesson 089 — `set -o pipefail` + macOS `screen -ls` exit 1 = silently broken detection

> **Promoted to R14** (2026-05-24, #649). This file is preserved for historical context.

**Date:** 2026-05-23
**Issues:** #633 (verify retry), #634 (critical orphan false-positive)
**Tags:** macOS, screen, bash, pipefail, false-diagnoses

## What happened

Four consecutive sprint-runner ticks (11:17, 11:47, 12:48, 13:17) logged
`WARNING: ... not visible in screen -ls after 5s — leaving alone`, even
though the sessions were ACTUALLY launching successfully and processing
work. I attributed this to "screen socket-registration lag under launchd"
(lesson 085) and shipped two follow-up fixes (#623 retry loop, #633
pgrep switch) before realising the real cause.

Worse: the same bug poisoned `find_orphan_worktrees`. The next `mode_run`
tick would have called `gc_worktrees`, which would have called
`git worktree remove --force` on the **live, in-flight** sprint-482
worktree, deleting two TDD commits a spawned session had just made.
Caught the second-order bug just before it fired (~15 min before the
13:47 launchd tick would have run gc_worktrees).

## Root cause

macOS `screen -ls` exits 1 even when sessions are present:

```bash
$ screen -ls > /dev/null; echo $?
1
```

(The exit code is documented as "1 = no screens" but the implementation
returns 1 on the "There is a screen on:" path too on this build. Empirical.)

Combined with the script's `set -o pipefail`, every pipeline of the form
`screen -ls 2>&1 | grep -q "..."` returns 1 — the rightmost non-zero
status, which is `screen`'s. Even when `grep` matched and returned 0,
pipefail propagates `screen`'s 1. Then `! pipeline` evaluates true,
sending the "not found" branch every time.

The first fix (`|| true`) would have worked. So would dropping `pipefail`
locally. But the root cause was a category error — I trusted `screen -ls`
as a reliable predicate when its exit code is fundamentally unreliable
under pipefail.

## Why my diagnostic took so long

- **Manual reproduction was clean.** Interactive `bash -c 'screen -ls | grep -q "..."'`
  works because the default interactive shell doesn't enable `pipefail`.
- **My script-side test missed pipefail.** I tested `screen -ls 2>&1 | grep`
  in a one-liner without `set -o pipefail`. Worked. Concluded the bug was
  elsewhere (socket-lag, multi-line `cd`, etc.).
- **Each false-WARN looked plausible** — there were genuinely race-prone
  surfaces (socket registration, multi-line path corruption) that produced
  similar symptoms.

I narrowed the wrong way: kept trusting `screen -ls` while suspecting
everything else around it. The pipefail interaction would have surfaced
immediately if I had isolated the predicate FROM ALL its surrounding
context (including the shell's set options) at the start.

## Fix

Switched to `pgrep -f "SCREEN -dmS sprint-runner-$n"`. The screen daemon
is in the process table immediately on fork — no exit-code-vs-pipefail
interaction. Both callsites (`find_orphan_worktrees`, verify retry)
updated. `list_sprint_screens` was already safe via `|| true`.

## How to apply

- **A command's exit code is part of its API**, not an afterthought. If you
  pipe it into a strict pipeline (pipefail), verify the exit semantics for
  every case you care about, not just the success path.
- **`set -o pipefail` is a foot-gun for "any one in a pipeline failed"
  pipelines.** When you genuinely don't care about non-rightmost exits
  (e.g., reading output regardless of the producer's exit code), either
  drop `pipefail` locally or absorb the exit with `|| true` after.
- **When a manual test passes but the scripted version fails, suspect
  shell-options drift before suspecting race conditions or timing.**
  `set -e`, `set -u`, `set -o pipefail` change behaviour silently.
  Reproduce under EXACT script conditions (`bash -c 'set -euo pipefail; ...'`)
  before chasing exotic causes.
- **A false-negative in detection logic can be MORE dangerous than a true
  failure.** If "is this thing alive" reliably says "no" when the thing is
  alive, every downstream cleanup will run and destroy live state.

## Related

- [[083-exit-trap-return-value-is-the-scripts-exit-code]] — also a
  bash subtlety (trap exit code overrides script's). Same family of
  "shell option interacts with what looks like normal code."
- [[085-screen-dms-socket-registration-can-lag-launch-success]] —
  the lesson I wrote about #623. **The diagnosis was wrong.** The real
  cause was pipefail. I'm leaving lesson 085 in place but it's been
  superseded by this one for the screen-ls case specifically; the
  "eventual visibility" principle from 085 still applies to genuine
  filesystem-visibility races.
- [[086-close-then-tick-ordering-can-trigger-duplicate-sprint-launches]]
- [[087-spawned-sessions-need-their-own-worktree-not-shared-checkout]]
- [[088-single-action-per-tick-was-a-false-virtue]]

Five sprint-runner lessons in a single day's investigation. The runner is
finally past its honeymoon period; the surfaces it touches (screen,
launchd, git worktrees, gh API, macOS pipefail) each had at least one
subtle gotcha. Worth keeping all the lessons — the next person debugging
this code (likely future-me) will hit at least one of them again.

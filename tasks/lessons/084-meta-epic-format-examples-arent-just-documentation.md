# Lesson 084 — A "documentation example" of a parsed format is also valid input

**Date:** 2026-05-23
**Issue:** #605 (META_EPIC meta-epic mode for sprint-runner)
**Tags:** parsing, markdown, regex, autonomy

## What happened

When I created the META_EPIC root issue (#606) I put concrete example lines
inside an HTML comment to show the format:

```html
<!--
Examples:
- [ ] **Epic Brand Phase 2** — #700
-->
```

The intent was "here's the format for future-me, hidden by Markdown rendering."
The reality: `find_first_unchecked_epic` is a `grep -E` over the issue body,
and **grep doesn't understand HTML comments**. The first integration test
matched the example line, resolved `EPIC=700`, then tried to drill into a
non-existent issue.

## Root cause

Comments are a _rendering_ construct, not a _content_ construct. The runner
fetches `gh issue view --json body --jq .body`, which returns the raw markdown
including `<!-- -->` blocks. Any regex over that body is comment-blind.

This generalises: if you build a tool that parses a free-form text input
provided by humans, **examples written in that input language are
indistinguishable from real input**.

## Fix

Strip the example lines from the META_EPIC body. Describe the format in
prose and in a fenced code block (which the regex _also_ doesn't understand,
but fenced lines start with backticks, not `- [ ]`, so they don't match).

## How to apply

- When your input format is "match these lines," never include sample
  matching lines inside the same document — not even in comments, alt-text,
  or HTML attributes. Use prose, code fences, or a different document.
- More generally: when a regex consumes operator-edited content, assume
  the operator _will_ paste back snippets from your docs. Make those
  snippets either invalid-by-construction or live in a separate place.
- If you must keep examples in the same document, change them just enough
  to break the matcher — e.g. `- [N] **Epic ...** — #N` (lowercase `n`,
  invalid checkbox).

## Related

- [[reference_data_pipeline]] — same family of bug: a "snapshot" looks like
  the live data, so anything that walks both must distinguish them at the
  source, not the parse.

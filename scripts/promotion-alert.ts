/**
 * Promotion-Held Alert — Runner (#1073, epic #1072)
 *
 * Thin glue around the pure functions in ./lib/promotionAlert.js:
 *   1. read the two gate outputs (count gate + #1034 value gate) and the
 *      value-diff JSON the pipeline already produced,
 *   2. decide whether promotion was blocked (file/refresh a `promotion-held`
 *      issue) or promoted (auto-close it),
 *   3. emit the decision + alert title/body for the data-pipeline workflow.
 *
 * No decision logic lives here — that is unit-tested in
 * scripts/lib/__tests__/promotionAlert.test.ts. All logging goes to stderr
 * (R4); stdout/$GITHUB_OUTPUT carry only the structured decision.
 *
 * Env:
 *   COUNT_PROMOTE   — `steps.diff.outputs.promote`        ("true"/"false")
 *   VALUE_PROMOTE   — `steps.valuediff.outputs.value_promote` ("true"/"false")
 *   VALUE_DIFF_FILE — path to the value-diff JSON (default /tmp/value-diff.json)
 *
 * Always exits 0; the workflow decides whether to open/refresh or close the
 * issue based on the `blocked`/`promoted` outputs. A missing/garbage
 * value-diff does NOT flip the block decision (that is the gate outputs' job)
 * — it only means the staging-ahead content signal can't be confirmed.
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import {
  evaluatePromotion,
  buildPromotionHeldTitle,
  buildPromotionHeldBody,
  type ValueDiffOutput,
} from './lib/promotionAlert.js'

const DEFAULT_VALUE_DIFF_FILE = '/tmp/value-diff.json'
const BODY_FILE = '/tmp/promotion-held-body.md'

function log(msg: string): void {
  process.stderr.write(`${msg}\n`)
}

function emitOutput(key: string, value: string): void {
  const out = process.env.GITHUB_OUTPUT
  if (out) appendFileSync(out, `${key}=${value}\n`)
}

/** Parse the value-diff JSON, returning null on any read/parse failure. */
function readValueDiff(path: string): ValueDiffOutput | null {
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'report' in parsed &&
      Array.isArray((parsed as ValueDiffOutput).report?.changed)
    ) {
      return parsed as ValueDiffOutput
    }
    log(`Value-diff at ${path} missing a usable .report.changed — ignoring.`)
    return null
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`Could not read value-diff at ${path}: ${message}`)
    return null
  }
}

function main(): void {
  const countPromote = process.env.COUNT_PROMOTE === 'true'
  const valuePromote = process.env.VALUE_PROMOTE === 'true'
  const valueDiffFile = process.env.VALUE_DIFF_FILE || DEFAULT_VALUE_DIFF_FILE
  const now = new Date()

  log(
    `Gate outputs — count_promote=${countPromote} value_promote=${valuePromote}`
  )
  const valueDiff = readValueDiff(valueDiffFile)
  const result = evaluatePromotion({ countPromote, valuePromote, valueDiff })

  log(
    `Decision — blocked=${result.blocked} gate=${result.gate} ` +
      `stagingAhead=${result.stagingAhead} changedDates=${result.changedDateCount}`
  )

  emitOutput('blocked', String(result.blocked))
  emitOutput('promoted', String(result.promoted))
  emitOutput('gate', result.gate)
  emitOutput('staging_ahead', String(result.stagingAhead))

  if (result.blocked) {
    writeFileSync(BODY_FILE, buildPromotionHeldBody(result, { now }))
    emitOutput('title', buildPromotionHeldTitle(result))
    emitOutput('body_file', BODY_FILE)
    log('Promotion is HELD — alert body written.')
  } else {
    log('Promotion succeeded — any open promotion-held issue should close.')
  }
}

try {
  main()
} catch (err) {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  log(`Unexpected error: ${message}`)
  // A monitor that can't read its own signal must ALERT, not pass silently
  // (Lesson 107). If the runner crashes we can't confirm the promotion
  // succeeded, so treat it as held and file an issue with a fallback body —
  // mirroring how the freshness runner surfaces its own crash as stale.
  try {
    writeFileSync(
      BODY_FILE,
      [
        '## 🚫 Promotion-held alert runner crashed',
        '',
        'The `scripts/promotion-alert.ts` runner threw before it could decide whether staging → production promotion succeeded. **Treat production as potentially stale** and check the run logs / step summary for the gate outcome.',
        '',
        '```',
        message,
        '```',
        '',
        '---',
        '_Filed by `.github/workflows/data-pipeline.yml` (#1073)._',
      ].join('\n')
    )
    emitOutput('body_file', BODY_FILE)
    emitOutput('title', '🚫 Promotion-held alert runner crashed (#1073)')
  } catch {
    // If even the fallback body can't be written, still flag blocked so the
    // workflow's create step surfaces *something* rather than going quiet.
  }
  emitOutput('blocked', 'true')
  emitOutput('promoted', 'false')
}

process.exit(0)

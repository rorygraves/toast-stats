import { describe, it, expect } from 'vitest'
import { ESLint } from 'eslint'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Resolve the frontend workspace root from this file's own location so the
// test is independent of the runner's cwd (root `npm run test` launches from
// the repo root; the frontend workspace run launches from frontend/).
const frontendDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)

const RULE = 'react-hooks/set-state-in-effect'

// The exact anti-pattern #340 removed from DateRangeSelector and the three
// column filters: mirror a prop into local state via a useEffect setter.
// eslint-plugin-react-hooks 7.0.1 declares this rule at error in its
// recommended config but does NOT actually detect this pattern (inert);
// 7.1.1 activates real detection (#375). A config-severity assertion alone
// would have passed against the inert 7.0.1 rule, so this sentinel lints a
// known-bad snippet through the project's real ESLint config to prove the
// rule is genuinely catching the anti-pattern. If a future dependency or
// config change makes the rule inert again, this fails loudly instead of
// silently re-admitting the pattern. See tasks/lessons/082.
const OFFENDING_SOURCE = `import { useState, useEffect } from 'react'
export function MirrorPropIntoState({ value }: { value: string }) {
  const [local, setLocal] = useState(value)
  useEffect(() => {
    setLocal(value)
  }, [value])
  return local
}
`

describe('react-hooks/set-state-in-effect enforcement (#375)', () => {
  // ESLint loads the full flat config (typescript-eslint + react-hooks
  // plugins) on first run, which is heavier than a unit test — allow headroom
  // over the 5s global default rather than risk a cold-CI-runner flake.
  it('flags a setState-in-effect violation as an error', async () => {
    const eslint = new ESLint({ cwd: frontendDir })
    const [result] = await eslint.lintText(OFFENDING_SOURCE, {
      filePath: path.join(
        frontendDir,
        'src/__sentinel__/MirrorPropIntoState.tsx'
      ),
    })

    const errors = result.messages.filter(
      m => m.ruleId === RULE && m.severity === 2
    )

    expect(errors.length).toBeGreaterThan(0)
  }, 20000)
})

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  collectI18nStandardsViolations,
  runI18nStandardsSelfTest,
} from './check-i18n-standards'
import type { I18nStandardsSelfTestCase } from './check-i18n-standards'
import type { ESLint } from 'eslint'

function selfTestDir(name: string): string {
  return join(
    import.meta.dirname,
    '..',
    'src',
    `__i18n_standards_test_${name}__`,
  )
}

describe('collectI18nStandardsViolations', () => {
  it('keeps only target i18n rules and fatal parser errors', () => {
    const results = [
      {
        filePath: '/repo/src/Demo.tsx',
        messages: [
          {
            ruleId: 'lingui/no-unlocalized-strings',
            line: 3,
            column: 12,
            message: 'String not marked for translation.',
          },
          {
            ruleId: 'no-shadow',
            line: 4,
            column: 8,
            message: 'Shadowed variable.',
          },
          {
            ruleId: null,
            fatal: true,
            line: 5,
            column: 1,
            message: 'Parsing error.',
          },
        ],
      },
    ] as ESLint.LintResult[]

    const violations = collectI18nStandardsViolations(results)

    expect(violations.map((violation) => violation.ruleId)).toEqual([
      'lingui/no-unlocalized-strings',
      'eslint/fatal',
    ])
  })
})

describe('runI18nStandardsSelfTest', () => {
  it('passes the bundled cases that should catch the common AI mistakes', async () => {
    const dir = selfTestDir('bundled')
    const failures = await runI18nStandardsSelfTest(undefined, {
      selfTestDir: dir,
    })

    expect(failures).toEqual([])
    expect(existsSync(dir)).toBe(false)
  }, 15_000)

  it('fails when a raw visible string is expected to pass', async () => {
    const dir = selfTestDir('negative')
    const cases: I18nStandardsSelfTestCase[] = [
      {
        name: 'bad-visible-copy',
        expectedRules: [],
        code: `
          export function Demo() {
            return <button aria-label="Save campaign">Save campaign</button>
          }
        `,
      },
    ]

    const failures = await runI18nStandardsSelfTest(cases, {
      selfTestDir: dir,
    })

    expect(failures).toHaveLength(1)
    expect(failures[0]).toContain('bad-visible-copy')
    expect(failures[0]).toContain('lingui/no-unlocalized-strings')
    expect(existsSync(dir)).toBe(false)
  }, 15_000)
})

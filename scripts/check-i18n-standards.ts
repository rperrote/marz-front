/**
 * Gate deterministico para copy visible sin Lingui.
 *
 * Uso:
 *   pnpm check:i18n-standards
 *   pnpm check:i18n-standards:self-test
 *
 * El script reutiliza ESLint/Lingui como motor, pero convierte esas reglas en
 * gate explicito: cualquier `lingui/no-unlocalized-strings` o
 * `lingui/no-expression-in-message` falla el comando aunque ESLint las tenga
 * configuradas como warning.
 */
import { ESLint } from 'eslint'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import process from 'node:process'

const ROOT = join(import.meta.dirname, '..')
const SELF_TEST_DIR = join(ROOT, 'src', '__i18n_standards_self_test__')

const TARGET_RULES = new Set([
  'lingui/no-unlocalized-strings',
  'lingui/no-expression-in-message',
])

export interface I18nStandardsViolation {
  filePath: string
  line: number
  column: number
  ruleId: string
  message: string
}

export interface I18nStandardsSelfTestCase {
  name: string
  code: string
  expectedRules: string[]
}

export interface I18nStandardsSelfTestOptions {
  selfTestDir?: string
}

function isTargetRule(ruleId: string | null): ruleId is string {
  return ruleId !== null && TARGET_RULES.has(ruleId)
}

function toDisplayPath(filePath: string): string {
  return relative(ROOT, filePath) || filePath
}

export function collectI18nStandardsViolations(
  results: ESLint.LintResult[],
): I18nStandardsViolation[] {
  const violations: I18nStandardsViolation[] = []

  for (const result of results) {
    for (const message of result.messages) {
      if (!isTargetRule(message.ruleId) && !message.fatal) continue
      violations.push({
        filePath: toDisplayPath(result.filePath),
        line: message.line,
        column: message.column,
        ruleId: message.ruleId ?? 'eslint/fatal',
        message: message.message,
      })
    }
  }

  return violations
}

function printViolations(violations: I18nStandardsViolation[]): void {
  console.error(`FOUND ${violations.length} i18n standard violation(s):\n`)

  for (const violation of violations) {
    console.error(
      `  ${violation.filePath}:${violation.line}:${violation.column} ${violation.ruleId}`,
    )
    console.error(`    ${violation.message}`)
  }

  console.error(
    '\nWrap visible UI copy with t`...` or <Trans>...</Trans>. For non-UI constants, add a narrow eslint disable with a reason.',
  )
}

async function checkProject(): Promise<void> {
  const eslint = new ESLint({ cwd: ROOT })
  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}'])
  const violations = collectI18nStandardsViolations(results)

  if (violations.length > 0) {
    printViolations(violations)
    process.exit(1)
  }

  console.log('OK: no visible UI copy outside Lingui.')
}

function selfTestFilePath(dir: string, name: string): string {
  return join(dir, `${name}.tsx`)
}

async function runSelfTestCase(
  eslint: ESLint,
  testCase: I18nStandardsSelfTestCase,
  selfTestDir: string,
): Promise<string | null> {
  const filePath = selfTestFilePath(selfTestDir, testCase.name)
  writeFileSync(filePath, testCase.code.trimStart(), 'utf8')

  const results = await eslint.lintFiles([filePath])
  const actualRules = collectI18nStandardsViolations(results)
    .map((v) => v.ruleId)
    .toSorted()
  const expectedRules = testCase.expectedRules.toSorted()

  if (actualRules.join('|') === expectedRules.join('|')) {
    return null
  }

  return [
    `Self-test failed: ${testCase.name}`,
    `  expected: ${expectedRules.length > 0 ? expectedRules.join(', ') : '(none)'}`,
    `  actual:   ${actualRules.length > 0 ? actualRules.join(', ') : '(none)'}`,
  ].join('\n')
}

export function createI18nStandardsSelfTestCases(): I18nStandardsSelfTestCase[] {
  return [
    {
      name: 'valid-trans-and-t',
      expectedRules: [],
      code: `
        import { t } from '@lingui/core/macro'
        import { Trans } from '@lingui/react/macro'

        export function Demo({ count }: { count: number }) {
          const label = t\`Create campaign\`
          const ariaLabel = t\`Open campaign \${count}\`
          return <button aria-label={ariaLabel}><Trans>{label}</Trans></button>
        }
      `,
    },
    {
      name: 'detects-jsx-text',
      expectedRules: ['lingui/no-unlocalized-strings'],
      code: `
        export function Demo() {
          return <h1>Create campaign</h1>
        }
      `,
    },
    {
      name: 'detects-visible-attribute',
      expectedRules: ['lingui/no-unlocalized-strings'],
      code: `
        export function Demo() {
          return <input placeholder="Search creators" />
        }
      `,
    },
    {
      name: 'detects-toast-literal',
      expectedRules: ['lingui/no-unlocalized-strings'],
      code: `
        import { toast } from 'sonner'

        export function Demo() {
          toast.error('Could not save campaign')
          return null
        }
      `,
    },
    {
      name: 'detects-expression-in-message',
      expectedRules: ['lingui/no-expression-in-message'],
      code: `
        import { t } from '@lingui/core/macro'

        export function getLabel(user: { name: string }) {
          return t\`Creator \${user.name}\`
        }
      `,
    },
  ]
}

export async function runI18nStandardsSelfTest(
  cases = createI18nStandardsSelfTestCases(),
  options: I18nStandardsSelfTestOptions = {},
): Promise<string[]> {
  const eslint = new ESLint({ cwd: ROOT })
  const selfTestDir = options.selfTestDir ?? SELF_TEST_DIR
  const failures: string[] = []
  mkdirSync(selfTestDir, { recursive: true })

  try {
    const results = await Promise.all(
      cases.map((testCase) => runSelfTestCase(eslint, testCase, selfTestDir)),
    )
    for (const failure of results) {
      if (failure) failures.push(failure)
    }
  } finally {
    rmSync(selfTestDir, { force: true, recursive: true })
  }

  return failures
}

async function selfTest(): Promise<void> {
  const cases = createI18nStandardsSelfTestCases()
  const failures = await runI18nStandardsSelfTest(cases)

  if (failures.length > 0) {
    console.error(failures.join('\n\n'))
    process.exit(1)
  }

  console.log(`OK: i18n standards self-test passed (${cases.length} cases).`)
}

const isCli = import.meta.url === pathToFileURL(process.argv[1] ?? '').href

if (isCli && process.argv.includes('--self-test')) {
  await selfTest()
} else if (isCli) {
  await checkProject()
}

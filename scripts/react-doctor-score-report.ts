import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCORE_PATTERN =
  /(?:score|puntuaci[oó]n)\s*[:=]?\s*(\d{1,3})(?:\s*\/\s*100|\s*%)?/i

export interface ReactDoctorScoreReport {
  score: number | null
  minimumScore: number
  passed: boolean
  sourcePath: string
  issueSummary: string | null
  markdown: string
}

interface CliOptions {
  sourcePath: string
  minimumScore: number
  outputJsonPath: string | null
  outputMarkdownPath: string | null
}

export function parseReactDoctorScore(output: string): number | null {
  const jsonScore = parseJsonScore(output)
  if (jsonScore !== null) {
    return jsonScore
  }

  const match = SCORE_PATTERN.exec(output)
  if (!match?.[1]) {
    return null
  }

  const score = Number.parseInt(match[1], 10)
  return Number.isInteger(score) && score >= 0 && score <= 100 ? score : null
}

export function createReactDoctorScoreReport({
  output,
  sourcePath,
  minimumScore,
}: {
  output: string
  sourcePath: string
  minimumScore: number
}): ReactDoctorScoreReport {
  const score = parseReactDoctorScore(output)
  const passed = score !== null && score >= minimumScore
  const issueSummary = extractIssueSummary(output)

  return {
    score,
    minimumScore,
    passed,
    sourcePath,
    issueSummary,
    markdown: formatMarkdownReport({
      score,
      minimumScore,
      passed,
      sourcePath,
      issueSummary,
    }),
  }
}

function parseJsonScore(output: string): number | null {
  const trimmedOutput = output.trim()
  if (!trimmedOutput.startsWith('{')) {
    return null
  }

  try {
    const parsedOutput: unknown = JSON.parse(trimmedOutput)
    if (!isRecord(parsedOutput)) {
      return null
    }

    const score = parsedOutput.score
    return typeof score === 'number' && score >= 0 && score <= 100
      ? score
      : null
  } catch {
    return null
  }
}

function extractIssueSummary(output: string): string | null {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const summaryLine = lines.find((line) =>
    /\b(?:issues?|errors?|warnings?)\b/i.test(line),
  )

  return summaryLine ?? null
}

function formatMarkdownReport({
  score,
  minimumScore,
  passed,
  sourcePath,
  issueSummary,
}: Omit<ReactDoctorScoreReport, 'markdown'>): string {
  const statusLabel = passed ? 'PASS' : 'CHECK'
  const scoreLabel = score === null ? 'unavailable' : `${score}/100`
  const lines = [
    '<!-- marz-react-doctor-score -->',
    '## React Doctor score',
    '',
    `Status: **${statusLabel}**`,
    `Score: **${scoreLabel}**`,
    `Minimum target: **${minimumScore}/100**`,
    `Source: \`${basename(sourcePath)}\``,
  ]

  if (issueSummary !== null) {
    lines.push(`Summary: ${issueSummary}`)
  }

  if (score === null) {
    lines.push(
      '',
      'React Doctor ran, but the reporter could not parse a score from the output.',
    )
  }

  return `${lines.join('\n')}\n`
}

function parseCliOptions(argv: string[]): CliOptions {
  const sourcePath = argv[0]
  if (!sourcePath) {
    throw new Error(
      'Usage: tsx scripts/react-doctor-score-report.ts <report-file> [--min-score 95] [--output-json path] [--output-markdown path]',
    )
  }

  let minimumScore = 95
  let outputJsonPath: string | null = null
  let outputMarkdownPath: string | null = null

  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index]
    const nextArg = argv[index + 1]

    if (arg === '--min-score' && nextArg) {
      minimumScore = Number.parseInt(nextArg, 10)
      index += 1
      continue
    }

    if (arg === '--output-json' && nextArg) {
      outputJsonPath = nextArg
      index += 1
      continue
    }

    if (arg === '--output-markdown' && nextArg) {
      outputMarkdownPath = nextArg
      index += 1
      continue
    }

    throw new Error(`Unknown or incomplete argument: ${arg ?? ''}`)
  }

  if (
    !Number.isInteger(minimumScore) ||
    minimumScore < 0 ||
    minimumScore > 100
  ) {
    throw new Error('--min-score must be an integer from 0 to 100')
  }

  return {
    sourcePath,
    minimumScore,
    outputJsonPath,
    outputMarkdownPath,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function runCli() {
  try {
    const options = parseCliOptions(process.argv.slice(2))
    if (!existsSync(options.sourcePath)) {
      throw new Error(`Report file does not exist: ${options.sourcePath}`)
    }

    const output = readFileSync(options.sourcePath, 'utf8')
    const report = createReactDoctorScoreReport({
      output,
      sourcePath: options.sourcePath,
      minimumScore: options.minimumScore,
    })

    if (options.outputJsonPath !== null) {
      writeFileSync(
        options.outputJsonPath,
        `${JSON.stringify(report, null, 2)}\n`,
      )
    }

    if (options.outputMarkdownPath !== null) {
      writeFileSync(options.outputMarkdownPath, report.markdown)
    }

    process.stdout.write(report.markdown)
    process.exitCode = report.passed ? 0 : 1
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`${message}\n`)
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli()
}

import { describe, expect, it } from 'vitest'

import {
  createReactDoctorScoreReport,
  parseReactDoctorScore,
} from './react-doctor-score-report'

describe('parseReactDoctorScore', () => {
  it('parses a text score with a denominator', () => {
    expect(parseReactDoctorScore('React Doctor score: 96/100')).toBe(96)
  })

  it('parses a JSON score', () => {
    expect(parseReactDoctorScore('{"score":97,"issues":[]}')).toBe(97)
  })

  it('returns null when the score is not present', () => {
    expect(parseReactDoctorScore('React Doctor finished')).toBeNull()
  })
})

describe('createReactDoctorScoreReport', () => {
  it('marks the report as passing when the score meets the target', () => {
    const report = createReactDoctorScoreReport({
      output: 'score: 95/100\n0 issues',
      sourcePath: 'react-doctor-report.txt',
      minimumScore: 95,
    })

    expect(report.passed).toBe(true)
    expect(report.markdown).toContain('Score: **95/100**')
    expect(report.markdown).toContain('Status: **PASS**')
  })

  it('marks the report as check when the score is below target', () => {
    const report = createReactDoctorScoreReport({
      output: 'score: 94/100\n1 warning',
      sourcePath: 'react-doctor-report.txt',
      minimumScore: 95,
    })

    expect(report.passed).toBe(false)
    expect(report.markdown).toContain('Status: **CHECK**')
  })
})

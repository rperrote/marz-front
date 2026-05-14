import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import {
  extractCustomFetchEndpoint,
  findDirectApiCallViolations,
  isCustomFetchCall,
} from './check-direct-api-calls'

const tempRoots: string[] = []

function createProjectFixture(): { root: string; src: string } {
  const root = mkdtempSync(join(tmpdir(), 'marz-api-gate-'))
  const src = join(root, 'src')
  mkdirSync(src, { recursive: true })
  tempRoots.push(root)
  return { root, src }
}

function writeFixtureFile(root: string, path: string, content: string): void {
  const filePath = join(root, path)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content.trimStart(), 'utf8')
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true })
  }
})

describe('isCustomFetchCall', () => {
  it('detects direct calls with whitespace and generic type parameters', () => {
    expect(isCustomFetchCall('("/api/campaigns")')).toBe(true)
    expect(isCustomFetchCall('<CampaignResponse>("/api/campaigns")')).toBe(true)
    expect(isCustomFetchCall('\n  <Map<string, Campaign>>\n  ("/api")')).toBe(
      true,
    )
  })

  it('does not treat non-call references as calls', () => {
    expect(isCustomFetchCall(' as typeof customFetch')).toBe(false)
    expect(isCustomFetchCall(': CustomFetch')).toBe(false)
  })
})

describe('extractCustomFetchEndpoint', () => {
  it('extracts endpoints from multiline customFetch calls', () => {
    expect(
      extractCustomFetchEndpoint(
        'customFetch<CampaignResponse>(',
        "'/api/campaigns',\n{ method: 'GET' },",
      ),
    ).toBe('/api/campaigns')
  })
})

describe('findDirectApiCallViolations', () => {
  it('reports direct customFetch calls in source files', () => {
    const { root, src } = createProjectFixture()
    writeFixtureFile(
      root,
      'src/features/campaigns/direct.ts',
      `
        import { customFetch } from '#/shared/api/mutator'

        export async function loadCampaign() {
          return customFetch('/api/campaigns/123', { method: 'GET' })
        }
      `,
    )

    expect(findDirectApiCallViolations({ root, src })).toEqual([
      expect.objectContaining({
        file: 'src/features/campaigns/direct.ts',
        line: 4,
        endpoint: '/api/campaigns/123',
      }),
    ])
  })

  it('ignores generated clients, tests, comments, and imports', () => {
    const { root, src } = createProjectFixture()
    writeFixtureFile(
      root,
      'src/shared/api/generated/campaigns.ts',
      `
        export function generated() {
          return customFetch('/api/generated')
        }
      `,
    )
    writeFixtureFile(
      root,
      'src/features/campaigns/direct.test.ts',
      `
        customFetch('/api/test-only')
      `,
    )
    writeFixtureFile(
      root,
      'src/features/campaigns/safe.ts',
      `
        import { customFetch } from '#/shared/api/mutator'
        // customFetch('/api/comment')
        const ref = customFetch
      `,
    )

    expect(findDirectApiCallViolations({ root, src })).toEqual([])
  })
})

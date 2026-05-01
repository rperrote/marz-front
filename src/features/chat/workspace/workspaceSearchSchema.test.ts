import { describe, it, expect } from 'vitest'

import {
  brandWorkspaceSearchSchema,
  creatorWorkspaceSearchSchema,
} from './workspaceSearchSchema'

describe('brandWorkspaceSearchSchema', () => {
  it('applies default filter when missing', () => {
    const result = brandWorkspaceSearchSchema.parse({})
    expect(result).toEqual({ filter: 'all' })
  })

  it('accepts valid filter values', () => {
    expect(brandWorkspaceSearchSchema.parse({ filter: 'unread' })).toEqual({
      filter: 'unread',
    })
    expect(brandWorkspaceSearchSchema.parse({ filter: 'needs_reply' })).toEqual(
      {
        filter: 'needs_reply',
      },
    )
  })

  it('falls back to default on invalid filter', () => {
    const result = brandWorkspaceSearchSchema.parse({ filter: 'invalid' })
    expect(result.filter).toBe('all')
  })

  it('accepts search string', () => {
    const result = brandWorkspaceSearchSchema.parse({ search: 'test' })
    expect(result.search).toBe('test')
  })

  it('accepts campaign_id', () => {
    const result = brandWorkspaceSearchSchema.parse({ campaign_id: 'abc-123' })
    expect(result.campaign_id).toBe('abc-123')
  })

  it('catches invalid search gracefully', () => {
    const result = brandWorkspaceSearchSchema.parse({ search: 123 })
    expect(result.search).toBeUndefined()
  })

  it('catches invalid campaign_id gracefully', () => {
    const result = brandWorkspaceSearchSchema.parse({ campaign_id: 123 })
    expect(result.campaign_id).toBeUndefined()
  })
})

describe('creatorWorkspaceSearchSchema', () => {
  it('applies default filter when missing', () => {
    const result = creatorWorkspaceSearchSchema.parse({})
    expect(result).toEqual({ filter: 'all' })
  })

  it('accepts valid filter values', () => {
    expect(creatorWorkspaceSearchSchema.parse({ filter: 'unread' })).toEqual({
      filter: 'unread',
    })
  })

  it('accepts search string', () => {
    const result = creatorWorkspaceSearchSchema.parse({ search: 'test' })
    expect(result.search).toBe('test')
  })

  it('does not include campaign_id', () => {
    const result = creatorWorkspaceSearchSchema.parse({
      campaign_id: 'abc-123',
    })
    expect(result).not.toHaveProperty('campaign_id')
  })

  it('catches invalid search gracefully', () => {
    const result = creatorWorkspaceSearchSchema.parse({ search: 123 })
    expect(result.search).toBeUndefined()
  })
})

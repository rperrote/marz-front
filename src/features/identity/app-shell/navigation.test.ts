import { describe, expect, it } from 'vitest'

import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'

const brandItems = shellNavigationConfig.brand
const creatorItems = shellNavigationConfig.creator

function itemIds(items: ShellNavigationItem[]) {
  return items.map((item) => item.id)
}

function enabledItemIds(items: ShellNavigationItem[]) {
  return items.filter((item) => !item.disabled).map((item) => item.id)
}

describe('shellNavigationConfig', () => {
  it('defines brand items in order with only workspace and inbox enabled', () => {
    expect(itemIds(brandItems)).toEqual([
      'home',
      'inbox',
      'workspace',
      'campaigns',
      'creators',
      'analytics',
    ])
    expect(enabledItemIds(brandItems)).toEqual(['inbox', 'workspace'])
  })

  it('defines creator items in order with only workspace and inbox enabled', () => {
    expect(itemIds(creatorItems)).toEqual([
      'home',
      'inbox',
      'workspace',
      'analytics',
    ])
    expect(enabledItemIds(creatorItems)).toEqual(['inbox', 'workspace'])
  })

  it('uses message-square for the workspace icon', () => {
    const workspace = brandItems.find((item) => item.id === 'workspace')

    expect(workspace?.icon).toBe('message-square')
  })

  it('keeps disabled items non-navigable', () => {
    const disabledItems = [...brandItems, ...creatorItems].filter(
      (item) => item.disabled,
    )

    expect(disabledItems.length).toBeGreaterThan(0)
    for (const item of disabledItems) {
      expect(item.href).toBeUndefined()
      expect(item.disabledReason).toBe('Próximamente')
    }
  })
})

describe('resolveActiveSidebarItem', () => {
  it('resolves workspace for /workspace', () => {
    expect(resolveActiveSidebarItem(brandItems, '/workspace')?.id).toBe(
      'workspace',
    )
  })

  it('resolves inbox for /inbox', () => {
    expect(resolveActiveSidebarItem(brandItems, '/inbox')?.id).toBe('inbox')
  })

  it('ignores disabled items when the path matches their future route', () => {
    expect(resolveActiveSidebarItem(brandItems, '/campaigns/new')).toBeNull()
  })

  it('returns null when no enabled item matches', () => {
    expect(resolveActiveSidebarItem(creatorItems, '/auth')).toBeNull()
  })

  it('returns the enabled item with the longest href match', () => {
    const items: ShellNavigationItem[] = [
      {
        id: 'workspace',
        label: 'Workspace',
        icon: 'message-square',
        href: '/workspace',
      },
      {
        id: 'conversation',
        label: 'Conversation',
        icon: 'message-square',
        href: '/workspace/conversations',
      },
    ]

    expect(
      resolveActiveSidebarItem(items, '/workspace/conversations/123')?.id,
    ).toBe('conversation')
  })
})

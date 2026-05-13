import { describe, expect, it } from 'vitest'

import { resolveActiveSidebarItem, shellNavigationConfig } from './navigation'
import type { ShellNavigationItem } from './navigation'

const brandItems = shellNavigationConfig.brand
const creatorItems = shellNavigationConfig.creator

function itemIds(items: ShellNavigationItem[]) {
  return items.map((item) => item.id)
}

function enabledItemIds(items: ShellNavigationItem[]) {
  return items.reduce<string[]>((ids, item) => {
    if (!item.disabled) ids.push(item.id)
    return ids
  }, [])
}

describe('shellNavigationConfig', () => {
  it('defines brand items in order with workspace, inbox and payments enabled', () => {
    expect(itemIds(brandItems)).toEqual([
      'home',
      'inbox',
      'workspace',
      'campaigns',
      'payments',
      'creators',
      'analytics',
    ])
    expect(enabledItemIds(brandItems)).toEqual([
      'inbox',
      'workspace',
      'campaigns',
      'payments',
    ])
  })

  it('defines creator items in order with inbox, workspace, campaigns and earnings enabled', () => {
    expect(itemIds(creatorItems)).toEqual([
      'home',
      'inbox',
      'workspace',
      'campaigns',
      'earnings',
      'analytics',
    ])
    expect(enabledItemIds(creatorItems)).toEqual([
      'inbox',
      'workspace',
      'campaigns',
      'earnings',
    ])
  })

  it('uses message-square for the workspace icon', () => {
    const workspace = brandItems.find((item) => item.id === 'workspace')

    expect(workspace?.icon).toBe('message-square')
  })

  it('defines payments only for brand navigation with wallet icon', () => {
    const brandPayments = brandItems.find((item) => item.id === 'payments')
    const creatorPayments = creatorItems.find((item) => item.id === 'payments')

    expect(brandPayments).toEqual({
      id: 'payments',
      label: 'Payments & Spending',
      icon: 'wallet',
      href: '/payments',
    })
    expect(creatorPayments).toBeUndefined()
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

  it('resolves payments for /payments descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/payments')?.id).toBe(
      'payments',
    )
    expect(resolveActiveSidebarItem(brandItems, '/payments/export')?.id).toBe(
      'payments',
    )
  })

  it('resolves campaigns for /campaigns descendants', () => {
    expect(resolveActiveSidebarItem(brandItems, '/campaigns')?.id).toBe(
      'campaigns',
    )
    expect(resolveActiveSidebarItem(brandItems, '/campaigns/new')?.id).toBe(
      'campaigns',
    )
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

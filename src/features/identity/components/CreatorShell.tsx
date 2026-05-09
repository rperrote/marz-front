import type { ReactNode } from 'react'
import { t } from '@lingui/core/macro'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Megaphone } from 'lucide-react'

import { SidebarItem } from './SidebarItem'
import { SignOutButton } from './SignOutButton'

export function CreatorShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-4 text-sm font-semibold">Marz · Creator</div>
        <nav className="flex flex-col gap-1 px-2">
          <SidebarItem
            icon={Megaphone}
            label={t`Campañas`}
            active={pathname.startsWith('/campaigns')}
            onClick={() => {
              void navigate({ to: '/campaigns' })
            }}
          />
        </nav>
        <div className="mt-auto border-t border-sidebar-border p-2">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}

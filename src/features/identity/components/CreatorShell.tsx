import type { ReactNode } from 'react'

import { SignOutButton } from './SignOutButton'

export function CreatorShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-4 text-sm font-semibold">Marz · Creator</div>
        <div className="mt-auto border-t border-sidebar-border p-2">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}

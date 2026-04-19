import type { ReactNode } from 'react'

/**
 * Creator-side shell: sidebar with Offers / Deliverables / Earnings / Profile /
 * Settings. No workspace switcher — one creator per account.
 */
export function CreatorShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-4 text-sm font-semibold">Marz · Creator</div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}

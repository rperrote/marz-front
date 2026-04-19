import type { ReactNode } from 'react'

/**
 * Brand-side shell: sidebar with Campaigns / Influencers / Chat / Payments /
 * Settings, workspace switcher in topbar. Organisms get wired as identity is
 * built out; this is the structural skeleton.
 */
export function BrandShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-4 text-sm font-semibold">Marz · Brand</div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  )
}

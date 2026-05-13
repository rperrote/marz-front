import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { t } from '@lingui/core/macro'

import { trackWorkspaceOpened } from './analytics'
import { useWorkspaceRailSubscription } from './useWorkspaceRailSubscription'
import { useConversationRailStore } from './conversationRailStore'

interface WorkspaceLayoutProps {
  railCompact?: ReactNode
  railFull?: ReactNode
  children: ReactNode
  sessionKind?: 'brand' | 'creator'
}

export function WorkspaceLayout({
  railCompact,
  railFull,
  children,
  sessionKind,
}: WorkspaceLayoutProps) {
  // WS disabled until backend exposes workspace_rail topic — enable when marz-api#ws-rail lands
  useWorkspaceRailSubscription({ enabled: false })

  const isRailOpen = useConversationRailStore((s) => s.isOpen)
  const closeRail = useConversationRailStore((s) => s.close)

  useEffect(() => {
    if (!sessionKind) return
    trackWorkspaceOpened({ session_kind: sessionKind })
  }, [sessionKind])

  return (
    <div className="relative flex h-full">
      <aside
        role="region"
        aria-label={t`Conversaciones`}
        className="hidden w-14 shrink-0 overflow-hidden border-r border-border bg-background transition-[width] duration-300 ease-out md:block xl:w-80"
      >
        <div className="relative h-full">
          <div className="absolute left-0 top-0 h-full w-14 opacity-100 transition-opacity duration-200 xl:pointer-events-none xl:opacity-0">
            {railCompact}
          </div>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-80 opacity-0 transition-opacity duration-200 delay-150 xl:pointer-events-auto xl:opacity-100">
            {railFull}
          </div>
        </div>
      </aside>

      <button
        type="button"
        aria-label={t`Cerrar conversaciones`}
        onClick={closeRail}
        aria-hidden={!isRailOpen}
        tabIndex={isRailOpen ? 0 : -1}
        className={`absolute inset-0 z-20 bg-foreground/20 transition-opacity duration-300 ease-out xl:hidden ${
          isRailOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        role="region"
        aria-label={t`Conversaciones`}
        aria-hidden={!isRailOpen}
        className={`absolute left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-border bg-background shadow-xl transition-transform duration-300 ease-out xl:hidden ${
          isRailOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {railFull}
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}

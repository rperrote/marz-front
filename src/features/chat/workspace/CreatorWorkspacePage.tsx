import { CreatorShell } from '#/features/identity/components/CreatorShell'
import { ConversationRail } from '#/features/chat/workspace/ConversationRail'
import { EmptyConversationState } from '#/features/chat/workspace/EmptyConversationState'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'
import type { CreatorWorkspaceSearch } from '#/features/chat/workspace/workspaceSearchSchema'

interface CreatorWorkspacePageProps {
  search: CreatorWorkspaceSearch
}

export function CreatorWorkspacePage({ search }: CreatorWorkspacePageProps) {
  return (
    <CreatorShell>
      <WorkspaceLayout rail={<ConversationRail search={search} />}>
        <EmptyConversationState />
      </WorkspaceLayout>
    </CreatorShell>
  )
}

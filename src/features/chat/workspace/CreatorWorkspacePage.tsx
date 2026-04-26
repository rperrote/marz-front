import { CreatorShell } from '#/features/identity/components/CreatorShell'
import { EmptyConversationState } from '#/features/chat/workspace/EmptyConversationState'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'

export function CreatorWorkspacePage() {
  return (
    <CreatorShell>
      <WorkspaceLayout>
        <EmptyConversationState />
      </WorkspaceLayout>
    </CreatorShell>
  )
}

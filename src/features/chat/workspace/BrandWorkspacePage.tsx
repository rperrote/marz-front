import { BrandShell } from '#/features/identity/components/BrandShell'
import { EmptyConversationState } from '#/features/chat/workspace/EmptyConversationState'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'

export function BrandWorkspacePage() {
  return (
    <BrandShell>
      <WorkspaceLayout>
        <EmptyConversationState />
      </WorkspaceLayout>
    </BrandShell>
  )
}

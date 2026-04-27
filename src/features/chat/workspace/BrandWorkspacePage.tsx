import { BrandShell } from '#/features/identity/components/BrandShell'
import { ConversationRail } from '#/features/chat/workspace/ConversationRail'
import { EmptyConversationState } from '#/features/chat/workspace/EmptyConversationState'
import { WorkspaceLayout } from '#/features/chat/workspace/WorkspaceLayout'
import type { BrandWorkspaceSearch } from '#/features/chat/workspace/workspaceSearchSchema'

interface BrandWorkspacePageProps {
  search: BrandWorkspaceSearch
}

export function BrandWorkspacePage({ search }: BrandWorkspacePageProps) {
  return (
    <BrandShell>
      <WorkspaceLayout rail={<ConversationRail search={search} />}>
        <EmptyConversationState />
      </WorkspaceLayout>
    </BrandShell>
  )
}

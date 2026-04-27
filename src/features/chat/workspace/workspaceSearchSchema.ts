import { z } from 'zod'

const workspaceFilterSchema = z
  .enum(['all', 'unread', 'needs_reply'])
  .default('all')
  .catch('all')

export const brandWorkspaceSearchSchema = z.object({
  filter: workspaceFilterSchema,
  search: z.string().optional().catch(undefined),
  campaign_id: z.string().optional().catch(undefined),
})

export const workspaceSearchSchema = z.object({
  filter: workspaceFilterSchema,
  search: z.string().optional().catch(undefined),
  campaign_id: z.string().optional().catch(undefined),
})

export const creatorWorkspaceSearchSchema = z.object({
  filter: workspaceFilterSchema,
  search: z.string().optional().catch(undefined),
})

export type BrandWorkspaceSearch = z.infer<typeof brandWorkspaceSearchSchema>
export type CreatorWorkspaceSearch = z.infer<
  typeof creatorWorkspaceSearchSchema
>

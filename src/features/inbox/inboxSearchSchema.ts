import { z } from 'zod'

export const inboxSearchSchema = z.object({
  campaign_id: z.string().uuid().optional().catch(undefined),
})

export type InboxSearch = z.infer<typeof inboxSearchSchema>

import type { BriefDraft } from '#/features/campaigns/brief-builder/store'

export type BriefProcessingStepName =
  | 'reading_website'
  | 'processing_description'
  | 'generating_icp'
  | 'generating_scoring'
  | 'generating_filters'

export interface BriefProcessingStepCompleted {
  processing_token: string
  step: 1 | 2 | 3 | 4 | 5
  step_name: BriefProcessingStepName
  step_label: string
  total_steps: 5
  step_status: 'completed' | 'failed'
  error_message: string | null
  timestamp: string
}

export interface BriefProcessingCompleted {
  processing_token: string
  status: 'completed' | 'partial' | 'failed'
  brief_draft: BriefDraft
  fields_filled_count: number
  fields_empty_count: number
  processing_sec: number
}

export interface BriefProcessingFailed {
  processing_token: string
  error_code:
    | 'website_unreachable'
    | 'pdf_extraction_failed'
    | 'ai_timeout'
    | 'unknown'
  error_message: string
  retryable: boolean
}

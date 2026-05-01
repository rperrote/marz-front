import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'

import { DraftVersionList } from '../DraftVersionList'
import type { DraftDTO, ChangeRequestDTO } from '#/features/deliverables/types'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeDraft(overrides?: Partial<DraftDTO>): DraftDTO {
  return {
    id: 'draft-1',
    version: 1,
    original_filename: 'video.mp4',
    file_size_bytes: 1024,
    duration_sec: 120,
    mime_type: 'video/mp4',
    thumbnail_url: null,
    playback_url: 'https://cdn.example.com/video.mp4',
    playback_url_expires_at: '2099-01-01T00:00:00Z',
    submitted_at: '2026-04-01T00:00:00Z',
    submitted_by_account_id: 'creator-1',
    approved_at: null,
    ...overrides,
  }
}

function makeChangeRequest(
  overrides?: Partial<ChangeRequestDTO>,
): ChangeRequestDTO {
  return {
    id: 'cr-1',
    draft_id: 'draft-1',
    categories: ['audio'],
    notes: 'Fix audio',
    requested_at: '2026-04-02T00:00:00Z',
    requested_by_account_id: 'brand-1',
    ...overrides,
  }
}

describe('DraftVersionList', () => {
  it('renders no rows when drafts is empty', () => {
    render(<DraftVersionList drafts={[]} changeRequests={[]} />)
    expect(screen.queryByTestId('draft-version-row')).not.toBeInTheDocument()
  })

  it('renders one version with current badge and submitted status', () => {
    render(
      <DraftVersionList
        drafts={[makeDraft({ id: 'd1', version: 1 })]}
        changeRequests={[]}
      />,
    )

    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Submitted')).toBeInTheDocument()
  })

  it('renders three versions and marks the highest as current', () => {
    render(
      <DraftVersionList
        drafts={[
          makeDraft({ id: 'd1', version: 1 }),
          makeDraft({ id: 'd2', version: 2 }),
          makeDraft({ id: 'd3', version: 3 }),
        ]}
        changeRequests={[]}
      />,
    )

    const rows = screen.getAllByTestId('draft-version-row')
    expect(rows).toHaveLength(3)

    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('v3')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('shows approved status when draft has approved_at', () => {
    render(
      <DraftVersionList
        drafts={[
          makeDraft({
            id: 'd1',
            version: 1,
            approved_at: '2026-04-03T00:00:00Z',
          }),
        ]}
        changeRequests={[]}
      />,
    )

    expect(screen.getByText('Approved')).toBeInTheDocument()
  })

  it('shows changes_requested status when changeRequests includes the draft_id', () => {
    render(
      <DraftVersionList
        drafts={[makeDraft({ id: 'd1', version: 1 })]}
        changeRequests={[makeChangeRequest({ draft_id: 'd1' })]}
      />,
    )

    expect(screen.getByText('Changes requested')).toBeInTheDocument()
  })

  it('classifies each version correctly in a 3-round scenario', () => {
    render(
      <DraftVersionList
        drafts={[
          makeDraft({ id: 'draft-v1', version: 1 }),
          makeDraft({ id: 'draft-v2', version: 2 }),
          makeDraft({ id: 'draft-v3', version: 3 }),
        ]}
        changeRequests={[
          makeChangeRequest({ id: 'cr-1', draft_id: 'draft-v1' }),
          makeChangeRequest({ id: 'cr-2', draft_id: 'draft-v2' }),
        ]}
      />,
    )

    const rows = screen.getAllByTestId('draft-version-row')
    expect(rows).toHaveLength(3)

    const v1Row = rows[0]!
    expect(v1Row).toHaveTextContent('Changes requested')

    expect(screen.getAllByText('Changes requested')).toHaveLength(2)
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('opens preview dialog when play is clicked', async () => {
    const user = userEvent.setup()
    render(
      <DraftVersionList
        drafts={[makeDraft({ id: 'd1', version: 1 })]}
        changeRequests={[]}
      />,
    )

    const playButton = screen.getByRole('button', { name: /play draft v1/i })
    await user.click(playButton)

    expect(
      screen.getByRole('dialog', { name: /preview draft v1/i }),
    ).toBeInTheDocument()
  })

  it('has no axe violations', async () => {
    const { container } = render(
      <DraftVersionList
        drafts={[
          makeDraft({ id: 'd1', version: 1 }),
          makeDraft({ id: 'd2', version: 2 }),
        ]}
        changeRequests={[makeChangeRequest({ id: 'cr-1', draft_id: 'd2' })]}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

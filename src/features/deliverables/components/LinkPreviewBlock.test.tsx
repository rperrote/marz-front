import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LinkPreviewBlock } from './LinkPreviewBlock'
import type { PublishedLinkPreview } from '#/features/deliverables/types'

const url = 'https://youtube.com/watch?v=xK93'

describe('LinkPreviewBlock', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))),
    )
  })

  it('renders title and thumbnail preview as a blank-target link', () => {
    const preview: PublishedLinkPreview = {
      outcome: 'title_and_thumbnail',
      title: 'Launch recap',
      thumbnail_url: 'https://img.youtube.com/vi/xK93/maxresdefault.jpg',
    }

    render(<LinkPreviewBlock preview={preview} url={url} />)

    const link = screen.getByRole('link', { name: /launch recap/i })
    expect(link).toHaveAttribute('href', url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    const image = screen.getByRole('img', { name: 'Launch recap' })
    expect(image).toHaveAttribute('src', preview.thumbnail_url)
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(screen.getByText(url)).toBeInTheDocument()
  })

  it('hides the thumbnail when it fails to load', () => {
    const preview: PublishedLinkPreview = {
      outcome: 'title_and_thumbnail',
      title: 'Broken thumbnail',
      thumbnail_url: 'https://example.com/missing.jpg',
    }

    render(<LinkPreviewBlock preview={preview} url={url} />)

    const image = screen.getByRole('img', { name: 'Broken thumbnail' })
    fireEvent.error(image)

    expect(image).toHaveAttribute('hidden')
  })

  it('renders url_only as a URL link without image', () => {
    render(<LinkPreviewBlock preview={{ outcome: 'url_only' }} url={url} />)

    const link = screen.getByRole('link', { name: url })
    expect(link).toHaveAttribute('href', url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders failed as a URL link without image', () => {
    render(<LinkPreviewBlock preview={{ outcome: 'failed' }} url={url} />)

    const link = screen.getByRole('link', { name: url })
    expect(link).toHaveAttribute('href', url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('tracks link_url_clicked without preventing navigation', async () => {
    render(
      <LinkPreviewBlock
        preview={{ outcome: 'url_only' }}
        url={url}
        analytics={{
          deliverableId: 'del-1',
          linkId: 'link-1',
          platform: 'youtube',
          outcome: 'url_only',
        }}
      />,
    )

    const link = screen.getByRole('link', { name: url })
    expect(fireEvent.click(link)).toBe(true)

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(
      JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)),
    ).toEqual({
      event_name: 'link_url_clicked',
      occurred_at: expect.any(String),
      properties: {
        deliverable_id: 'del-1',
        link_id: 'link-1',
        platform: 'youtube',
        outcome: 'url_only',
      },
    })
  })

  it('does not track clicks when analytics context is absent', () => {
    render(<LinkPreviewBlock preview={{ outcome: 'url_only' }} url={url} />)

    fireEvent.click(screen.getByRole('link', { name: url }))

    expect(fetch).not.toHaveBeenCalled()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <LinkPreviewBlock
        preview={{
          outcome: 'title_and_thumbnail',
          title: 'Launch recap',
          thumbnail_url: 'https://img.youtube.com/vi/xK93/maxresdefault.jpg',
        }}
        url={url}
      />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

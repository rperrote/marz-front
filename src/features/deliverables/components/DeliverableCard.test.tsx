import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DeliverableCard } from './DeliverableCard'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('DeliverableCard', () => {
  it('renders a submitted link URL with neutral status copy', () => {
    const url = 'https://www.youtube.com/watch?v=submitted123'

    render(
      <DeliverableCard
        platform="youtube"
        title="YouTube Video"
        status="link_submitted"
        drafts={[]}
        currentLink={{ url, status: 'submitted' }}
      />,
    )

    expect(screen.getAllByText('Link submitted')).toHaveLength(2)
    expect(screen.getByRole('link', { name: url })).toHaveAttribute('href', url)
  })

  it('renders approved links as Link approved', () => {
    const url = 'https://www.youtube.com/watch?v=approved123'

    render(
      <DeliverableCard
        platform="youtube"
        title="YouTube Video"
        status="completed"
        drafts={[]}
        currentLink={{ url, status: 'approved' }}
      />,
    )

    expect(screen.getAllByText('Link approved')).toHaveLength(2)
    expect(screen.getByRole('link', { name: url })).toHaveAttribute('href', url)
  })
})

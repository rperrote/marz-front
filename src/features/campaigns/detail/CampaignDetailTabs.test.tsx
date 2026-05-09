import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { CampaignDetailTabs } from './CampaignDetailTabs'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

describe('CampaignDetailTabs', () => {
  it('does not navigate from the disabled analytics tab', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()

    render(
      <CampaignDetailTabs activeTab="overview" onTabChange={onTabChange} />,
    )

    const analytics = screen.getByRole('button', { name: /analytics/i })
    expect(analytics).toHaveAttribute('aria-disabled', 'true')

    await user.click(analytics)

    expect(onTabChange).not.toHaveBeenCalled()
  })

  it('navigates from enabled tabs', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()

    render(
      <CampaignDetailTabs activeTab="overview" onTabChange={onTabChange} />,
    )

    await user.click(screen.getByRole('button', { name: /discovery/i }))

    expect(onTabChange).toHaveBeenCalledWith('discovery')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <CampaignDetailTabs activeTab="overview" onTabChange={vi.fn()} />,
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

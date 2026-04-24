import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { Package } from 'lucide-react'
import { OnboardingContentTypeChip } from './OnboardingContentTypeChip'

describe('OnboardingContentTypeChip', () => {
  it('renders label and icon', () => {
    render(
      <OnboardingContentTypeChip
        label="Video"
        icon={Package}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByText('Video')).toBeInTheDocument()
  })

  it('calls onToggle on click', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingContentTypeChip
        label="Video"
        icon={Package}
        selected={false}
        onToggle={onToggle}
      />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onToggle on Space key', async () => {
    const onToggle = vi.fn()
    render(
      <OnboardingContentTypeChip
        label="Video"
        icon={Package}
        selected={false}
        onToggle={onToggle}
      />,
    )
    screen.getByRole('checkbox').focus()
    await userEvent.keyboard(' ')
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('reflects selected state', () => {
    render(
      <OnboardingContentTypeChip
        label="Video"
        icon={Package}
        selected={true}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <OnboardingContentTypeChip
        label="Video"
        icon={Package}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

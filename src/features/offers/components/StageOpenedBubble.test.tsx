import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'

import type { StageOpenedSnap } from '../types'
import { StageOpenedBubble } from './StageOpenedBubble'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

function makeSnap(overrides: Partial<StageOpenedSnap> = {}): StageOpenedSnap {
  return {
    position: 2,
    total: 3,
    name: 'Content Creation',
    prev_stage_position: null,
    ...overrides,
  }
}

describe('StageOpenedBubble', () => {
  it('renders first-stage text when prev_stage_position is null', () => {
    render(<StageOpenedBubble snapshot={makeSnap()} side="out" />)
    expect(
      screen.getByText('Stage 2/3: Content Creation is now open'),
    ).toBeInTheDocument()
  })

  it('renders follow-up text when prev_stage_position is not null', () => {
    render(
      <StageOpenedBubble
        snapshot={makeSnap({ prev_stage_position: 1 })}
        side="in"
      />,
    )
    expect(
      screen.getByText(
        'Previous stage approved — Stage 2: Content Creation is now open',
      ),
    ).toBeInTheDocument()
  })

  it('has role="status" for a11y', () => {
    render(<StageOpenedBubble snapshot={makeSnap()} side="out" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <StageOpenedBubble snapshot={makeSnap()} side="out" />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { P2Progress } from './P2Progress'
import { useBriefBuilderStore } from '../store'

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
})

describe('P2Progress', () => {
  it('shows loading state when processing', () => {
    useBriefBuilderStore.setState({ processingToken: 'tok-123' })
    render(<P2Progress />)
    expect(screen.getByText(/analizando tu marca/i)).toBeInTheDocument()
  })

  it('shows completion message when brief is ready', () => {
    useBriefBuilderStore.setState({
      processingToken: null,
      briefDraft: {
        title: 'Test',
        objective: 'Awareness',
        targetAudience: 'Gen Z',
        deliverables: [],
        budget: '',
        timeline: '',
      },
    })
    render(<P2Progress />)
    expect(screen.getByText(/brief generado/i)).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<P2Progress />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

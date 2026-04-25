import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { P4Confirm } from './P4Confirm'
import { useBriefBuilderStore } from '../store'

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
})

describe('P4Confirm', () => {
  it('shows fallback when no draft exists', () => {
    render(<P4Confirm />)
    expect(screen.getByText(/sin brief disponible/i)).toBeInTheDocument()
  })

  it('renders summary with draft data', () => {
    useBriefBuilderStore.setState({
      briefDraft: {
        title: 'Mi campaña',
        objective: 'Performance',
        targetAudience: 'Millennials',
        deliverables: ['1 video'],
        budget: 'USD 5000',
        timeline: '4 semanas',
      },
    })
    render(<P4Confirm />)
    expect(screen.getByText('Mi campaña')).toBeInTheDocument()
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Millennials')).toBeInTheDocument()
    expect(screen.getByText('1 video')).toBeInTheDocument()
    expect(screen.getByText('USD 5000')).toBeInTheDocument()
    expect(screen.getByText('4 semanas')).toBeInTheDocument()
  })

  it('omits empty fields from summary', () => {
    useBriefBuilderStore.setState({
      briefDraft: {
        title: 'Solo título',
        objective: '',
        targetAudience: '',
        deliverables: [],
        budget: '',
        timeline: '',
      },
    })
    render(<P4Confirm />)
    expect(screen.getByText('Solo título')).toBeInTheDocument()
    expect(screen.queryByText('Objetivo')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    useBriefBuilderStore.setState({
      briefDraft: {
        title: 'Test',
        objective: 'Awareness',
        targetAudience: 'Gen Z',
        deliverables: ['reel'],
        budget: 'USD 1000',
        timeline: '2 sem',
      },
    })
    const { container } = render(<P4Confirm />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

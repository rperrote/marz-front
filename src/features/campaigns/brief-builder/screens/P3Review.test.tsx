import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { P3Review } from './P3Review'
import { useBriefBuilderStore } from '../store'
import { renderWithValidation } from '../test-utils'

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
  useBriefBuilderStore.setState({
    briefDraft: {
      title: 'Campaña test',
      objective: 'Awareness',
      targetAudience: 'Gen Z',
      deliverables: ['1 reel', '2 stories'],
      budget: 'USD 3000',
      timeline: '3 semanas',
    },
  })
})

describe('P3Review', () => {
  it('renders all brief fields with pre-filled values', () => {
    renderWithValidation(<P3Review />)
    expect(screen.getByLabelText(/título de la campaña/i)).toHaveValue(
      'Campaña test',
    )
    expect(screen.getByLabelText(/^objetivo$/i)).toHaveValue('Awareness')
    expect(screen.getByLabelText(/audiencia objetivo/i)).toHaveValue('Gen Z')
    expect(screen.getByLabelText(/presupuesto/i)).toHaveValue('USD 3000')
    expect(screen.getByLabelText(/timeline/i)).toHaveValue('3 semanas')
  })

  it('updates store when title is changed', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P3Review />)
    const titleInput = screen.getByLabelText(/título de la campaña/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Nueva campaña')
    expect(useBriefBuilderStore.getState().briefDraft?.title).toBe(
      'Nueva campaña',
    )
  })

  it('renders with empty draft when briefDraft is null', () => {
    useBriefBuilderStore.setState({ briefDraft: null })
    renderWithValidation(<P3Review />)
    expect(screen.getByLabelText(/título de la campaña/i)).toHaveValue('')
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithValidation(<P3Review />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

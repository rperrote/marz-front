import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { P1Input } from './P1Input'
import { useBriefBuilderStore } from '../store'
import { renderWithValidation } from '../test-utils'

beforeEach(() => {
  useBriefBuilderStore.getState().reset()
})

describe('P1Input', () => {
  it('renders URL and description fields', () => {
    renderWithValidation(<P1Input />)
    expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
  })

  it('updates store on URL change', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P1Input />)
    await user.type(screen.getByLabelText(/sitio web/i), 'https://test.com')
    expect(useBriefBuilderStore.getState().formInput.websiteUrl).toBe(
      'https://test.com',
    )
  })

  it('updates store on description change', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P1Input />)
    await user.type(screen.getByLabelText(/descripción/i), 'Mi marca vende')
    expect(useBriefBuilderStore.getState().formInput.descriptionText).toBe(
      'Mi marca vende',
    )
  })

  it('shows hint when no input is provided', () => {
    renderWithValidation(<P1Input />)
    expect(screen.getByText(/completá al menos uno/i)).toBeInTheDocument()
  })

  it('hides hint when URL is filled', async () => {
    const user = userEvent.setup()
    renderWithValidation(<P1Input />)
    await user.type(screen.getByLabelText(/sitio web/i), 'https://a.com')
    expect(screen.queryByText(/completá al menos uno/i)).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = renderWithValidation(<P1Input />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

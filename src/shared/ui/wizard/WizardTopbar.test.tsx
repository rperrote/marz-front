import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { WizardTopbar } from './WizardTopbar'

describe('WizardTopbar', () => {
  it('renders step label', () => {
    render(<WizardTopbar stepLabel="Paso 3 de 10" />)
    expect(screen.getByText('Paso 3 de 10')).toBeInTheDocument()
  })

  it('renders exit button when onExit provided', async () => {
    const onExit = vi.fn()
    render(<WizardTopbar stepLabel="Paso 1 de 5" onExit={onExit} />)
    const exitBtn = screen.getByText('Salir')
    await userEvent.click(exitBtn)
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('does not render exit button when onExit is not provided', () => {
    render(<WizardTopbar stepLabel="Paso 1 de 5" />)
    expect(screen.queryByText('Salir')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <WizardTopbar stepLabel="Paso 1 de 5" onExit={() => {}} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

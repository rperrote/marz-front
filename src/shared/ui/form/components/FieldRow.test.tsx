import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { FieldRow } from './FieldRow'

describe('FieldRow', () => {
  it('wires label htmlFor to control id', () => {
    render(
      <FieldRow label="Email">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).toBeInTheDocument()
  })

  it('renders hint and connects aria-describedby', () => {
    render(
      <FieldRow label="Email" hint="Usá tu mail laboral">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    const input = screen.getByLabelText('Email')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    expect(screen.getByText('Usá tu mail laboral').id).toBe(describedBy)
  })

  it('renders error with role alert and replaces hint', () => {
    render(
      <FieldRow label="Email" hint="Hint" error="Email inválido">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Email inválido')
    expect(screen.queryByText('Hint')).not.toBeInTheDocument()
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('omits aria-describedby when no hint or error', () => {
    render(
      <FieldRow label="Email">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('renders without label when omitted', () => {
    render(
      <FieldRow>
        {(aria) => <input type="text" aria-label="bare" {...aria} />}
      </FieldRow>,
    )
    expect(screen.getByLabelText('bare')).toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(
      <FieldRow label="Email" hint="Optional">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('is axe-clean with error', async () => {
    const { container } = render(
      <FieldRow label="Email" error="Inválido">
        {(aria) => <input type="email" {...aria} />}
      </FieldRow>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

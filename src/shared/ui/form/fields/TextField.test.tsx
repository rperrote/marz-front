import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { z } from 'zod'
import { useAppForm } from '../app-form'

function Harness({
  defaultValue = '',
  onSubmit,
}: {
  defaultValue?: string
  onSubmit?: (email: string) => void
}) {
  const form = useAppForm({
    defaultValues: { email: defaultValue },
    validators: {
      onChange: z.object({
        email: z.string().email('Email inválido'),
      }),
    },
    onSubmit: ({ value }) => onSubmit?.(value.email),
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="email">
        {(field) => (
          <field.TextField label="Email" placeholder="tu@empresa.com" />
        )}
      </form.AppField>
      <button type="submit">submit</button>
    </form>
  )
}

describe('TextField', () => {
  it('renders with label and forwards placeholder', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'tu@empresa.com',
    )
  })

  it('updates field value on change', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Email')
    await user.type(input, 'a@b.co')
    expect(input).toHaveValue('a@b.co')
  })

  it('does not show error before touch', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Email')
    await user.type(input, 'no-mail')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows error after blur when invalid', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Email')
    await user.type(input, 'no-mail')
    await user.tab()
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Email inválido',
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears error once value is valid', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Email')
    await user.type(input, 'no-mail')
    await user.tab()
    expect(await screen.findByRole('status')).toBeInTheDocument()
    await user.clear(input)
    await user.type(input, 'a@b.co')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('is axe-clean', async () => {
    const { container } = render(<Harness defaultValue="a@b.co" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { z } from 'zod'
import { useAppForm } from '../app-form'

function Harness() {
  const form = useAppForm({
    defaultValues: { bio: '' },
    validators: {
      onChange: z.object({
        bio: z.string().min(10, 'Mínimo 10 caracteres'),
      }),
    },
    onSubmit: () => {},
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="bio">
        {(field) => <field.TextareaField label="Bio" />}
      </form.AppField>
    </form>
  )
}

describe('TextareaField', () => {
  it('updates value on change', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const ta = screen.getByLabelText('Bio')
    await user.type(ta, 'hola')
    expect(ta).toHaveValue('hola')
  })

  it('shows error after blur', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const ta = screen.getByLabelText('Bio')
    await user.type(ta, 'corto')
    await user.tab()
    expect(await screen.findByRole('alert')).toHaveTextContent(/Mínimo 10/i)
  })

  it('is axe-clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

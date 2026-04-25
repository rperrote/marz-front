import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { z } from 'zod'
import { useAppForm } from '../app-form'

function Harness() {
  const form = useAppForm({
    defaultValues: { age: null as number | null },
    validators: {
      onChange: z.object({
        age: z.number().min(18, 'Edad mínima 18').nullable(),
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
      <form.AppField name="age">
        {(field) => <field.NumberField label="Edad" />}
      </form.AppField>
    </form>
  )
}

describe('NumberField', () => {
  it('emits number on change', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Edad')
    await user.type(input, '25')
    expect(input).toHaveValue(25)
  })

  it('emits null when cleared', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = screen.getByLabelText('Edad')
    await user.type(input, '25')
    await user.clear(input)
    expect(input).toHaveValue(null)
  })

  it('is axe-clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

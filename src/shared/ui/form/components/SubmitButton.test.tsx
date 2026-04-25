import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { z } from 'zod'
import { useAppForm } from '../app-form'

function Harness({ onSubmit }: { onSubmit: () => Promise<void> }) {
  const form = useAppForm({
    defaultValues: { email: '' },
    validators: {
      onChange: z.object({ email: z.string().email('Inválido') }),
    },
    onSubmit,
  })
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.AppField name="email">
        {(field) => <field.TextField label="Email" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton label="Enviar" loadingLabel="Enviando..." />
      </form.AppForm>
    </form>
  )
}

describe('SubmitButton', () => {
  it('disables when form has invalid fields', async () => {
    const user = userEvent.setup()
    render(<Harness onSubmit={async () => {}} />)
    const button = screen.getByRole('button', { name: 'Enviar' })
    await user.type(screen.getByLabelText('Email'), 'no-mail')
    await user.tab()
    expect(button).toBeDisabled()
  })

  it('enables when form is valid', async () => {
    const user = userEvent.setup()
    render(<Harness onSubmit={async () => {}} />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    expect(screen.getByRole('button', { name: 'Enviar' })).not.toBeDisabled()
  })

  it('shows loading label while submitting', async () => {
    const user = userEvent.setup()
    let resolve: () => void = () => {}
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r
        }),
    )
    render(<Harness onSubmit={onSubmit} />)
    await user.type(screen.getByLabelText('Email'), 'a@b.co')
    await user.click(screen.getByRole('button'))
    expect(
      await screen.findByRole('button', { name: 'Enviando...' }),
    ).toBeInTheDocument()
    resolve()
  })
})

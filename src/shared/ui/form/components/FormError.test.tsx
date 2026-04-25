import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAppForm } from '../app-form'

function Harness() {
  const form = useAppForm({
    defaultValues: { x: '' },
    validators: {
      onSubmit: () => 'Algo salió mal',
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
      <form.AppForm>
        <form.FormError />
        <form.SubmitButton label="ok" />
      </form.AppForm>
    </form>
  )
}

describe('FormError', () => {
  it('renders nothing when no form-level error', () => {
    render(<Harness />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders error after submit fails', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'ok' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo salió mal')
  })
})

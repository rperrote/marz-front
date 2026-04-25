import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '#/shared/api/mutator'
import { useAppForm } from '../app-form'
import { applyBackendFieldErrors } from './applyBackendFieldErrors'

function Harness({ error }: { error: unknown }) {
  const form = useAppForm({
    defaultValues: { handle: 'taken' },
    onSubmit: () => {},
  })
  return (
    <form>
      <form.AppField name="handle">
        {(field) => <field.TextField label="Handle" />}
      </form.AppField>
      <button
        type="button"
        onClick={() =>
          applyBackendFieldErrors(form, error, {
            fallback: (msg) => {
              window.dispatchEvent(new CustomEvent('fallback', { detail: msg }))
            },
          })
        }
      >
        apply
      </button>
    </form>
  )
}

describe('applyBackendFieldErrors', () => {
  it('maps ApiError field_errors to form fields', async () => {
    const user = userEvent.setup()
    const apiErr = new ApiError(422, 'validation_error', 'invalid', {
      field_errors: { handle: ['Ya está tomado'] },
    })
    render(<Harness error={apiErr} />)
    await user.click(screen.getByText('apply'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya está tomado')
    expect(screen.getByLabelText('Handle')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('calls fallback when error is not an ApiError', async () => {
    const user = userEvent.setup()
    const handler = vi.fn()
    window.addEventListener('fallback', ((e: Event) =>
      handler((e as CustomEvent).detail)) as EventListener)
    render(<Harness error={new Error('network down')} />)
    await user.click(screen.getByText('apply'))
    expect(handler).toHaveBeenCalledWith('network down')
  })

  it('calls fallback when ApiError has no field_errors', async () => {
    const user = userEvent.setup()
    const handler = vi.fn()
    window.addEventListener('fallback', ((e: Event) =>
      handler((e as CustomEvent).detail)) as EventListener)
    const apiErr = new ApiError(500, 'server_error', 'boom')
    render(<Harness error={apiErr} />)
    await user.click(screen.getByText('apply'))
    expect(handler).toHaveBeenCalledWith('boom')
  })
})

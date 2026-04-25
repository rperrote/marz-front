import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { useAppForm } from '../app-form'

function Harness({ onChange }: { onChange?: (v: boolean) => void }) {
  const form = useAppForm({
    defaultValues: { notifications: false },
    onSubmit: () => {},
  })
  return (
    <form>
      <form.AppField
        name="notifications"
        listeners={{
          onChange: ({ value }) => onChange?.(value),
        }}
      >
        {(field) => <field.SwitchField label="Notificaciones" />}
      </form.AppField>
    </form>
  )
}

describe('SwitchField', () => {
  it('toggles on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const sw = screen.getByRole('switch', { name: 'Notificaciones' })
    await user.click(sw)
    expect(onChange).toHaveBeenLastCalledWith(true)
  })

  it('is axe-clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

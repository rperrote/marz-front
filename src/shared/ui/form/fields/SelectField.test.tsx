import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { useAppForm } from '../app-form'

const OPTIONS = [
  { value: 'fashion', label: 'Moda' },
  { value: 'food', label: 'Comida' },
] as const

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const form = useAppForm({
    defaultValues: { vertical: '' },
    onSubmit: () => {},
  })
  return (
    <form>
      <form.AppField
        name="vertical"
        listeners={{ onChange: ({ value }) => onChange?.(value) }}
      >
        {(field) => (
          <field.SelectField
            label="Vertical"
            placeholder="Elegí una"
            options={OPTIONS}
          />
        )}
      </form.AppField>
    </form>
  )
}

describe('SelectField', () => {
  it('renders trigger with placeholder', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Vertical')).toHaveTextContent('Elegí una')
  })

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await user.click(screen.getByLabelText('Vertical'))
    await user.click(await screen.findByRole('option', { name: 'Moda' }))
    expect(onChange).toHaveBeenLastCalledWith('fashion')
  })

  it('is axe-clean', async () => {
    const { container } = render(<Harness />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

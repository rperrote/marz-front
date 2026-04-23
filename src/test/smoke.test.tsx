import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
import { Button } from '#/components/ui/button'
import { renderWithProviders } from './utils'

describe('smoke test', () => {
  it('renders a button without axe violations', async () => {
    const { container } = renderWithProviders(<Button>Test Button</Button>)

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

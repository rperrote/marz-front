# testing

Vitest + Testing Library. Cargar cuando escribas tests, modifiques setup, o aparezca un test rojo.

## Stack

- **Vitest** — runner. Config en `vitest.config.ts` (revisar antes de tocar setup).
- **@testing-library/react** + **@testing-library/user-event** — render + interacción.
- **vitest-axe** — accessibility checks.
- **`vi.mock`** — mocks de módulos.

## Convención de archivos

Tests al lado del archivo testeado: `Foo.tsx` + `Foo.test.tsx`. NO carpeta `__tests__/`.

## Patrón base

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { MyComponent } from './MyComponent'

vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
    { __lingui: true },
  ),
}))

beforeEach(() => {
  // reset stores, mocks, etc.
})

describe('MyComponent', () => {
  it('does something', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(/* ... */).toBe(/* ... */)
  })

  it('is axe-clean', async () => {
    const { container } = render(<MyComponent />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

## Mock de Lingui

Siempre incluir el mock de `@lingui/core/macro` en tests que usan `t\`...\``. Sin él, los strings vienen como objetos raros.

## Mock de stores Zustand

Resetear el store en `beforeEach`:

```ts
beforeEach(() => {
  useBrandOnboardingStore.setState({
    currentStepIndex: 1,
    vertical: undefined,
    /* ... */
  })
})
```

NO `useStore.getState().reset()` porque puede gatillar persist. Usar `setState` directo.

## Mock de hooks Orval

Para hooks de React Query, mockear el módulo o envolver en `QueryClientProvider`. Ver tests existentes en `features/` para el patrón.

## Accessibility

`expect(await axe(container)).toHaveNoViolations()` en cada componente nuevo. Si rompe, revisar:

- Labels en inputs.
- `aria-label` en botones sin texto.
- Headings jerárquicos.
- Color contrast (vitest-axe lo flagea).

## Coverage

No hay coverage gate hard. La regla de oro: cualquier branch de lógica del feature tiene un test. UI puro (layout, composición) puede no tener test si no hay lógica.

## Cuándo NO escribir un test

- Renombrado de identifier sin cambio de behavior.
- Refactor con tests existentes que ya cubren el comportamiento.
- Cambios visuales sin lógica (eso se verifica en browser).

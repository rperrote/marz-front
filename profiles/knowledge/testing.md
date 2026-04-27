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

## E2E (Playwright)

### Arquitectura de test users

El backend expone endpoints de test (`/v1/test/accounts`, `/v1/test/accounts/{id}/onboarding`) que permiten crear usuarios de test y mutar su estado de onboarding. Esto resuelve el problema de que onboarding es un flujo unidireccional: cada test puede poner al usuario en el estado que necesite antes de correr.

### Flujo de un test E2E

1. `global-setup.ts` valida que existan `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` y `MARZ_TEST_SECRET`.
2. Cada test worker tiene un `testUser` único (basado en `workerIndex`). `ensureExists()` lo crea en Clerk + backend (idempotente).
3. El test setea el onboarding state vía `testUser.setOnboardingState(status, kind?)`.
4. El test hace `testUser.signIn(page)` — usa `@clerk/testing/playwright` con ticket strategy (bypass de email/password).
5. El test navega, hace assertions.
6. En teardown: `testUser.signOut(page)` y `testUser.delete()` (soft-delete).

### Fixtures disponibles

| Fixture                 | Estado del usuario al usar             |
| ----------------------- | -------------------------------------- |
| `testUser`              | Usuario limpio, sin setear estado      |
| `brandOnboardingUser`   | `onboarding_pending` + `kind: brand`   |
| `creatorOnboardingUser` | `onboarding_pending` + `kind: creator` |
| `onboardedBrandUser`    | `onboarded` + `kind: brand`            |
| `onboardedCreatorUser`  | `onboarded` + `kind: creator`          |

### Configuración requerida en `.env.local`

```bash
VITE_API_URL=http://localhost:8080
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
MARZ_TEST_SECRET=<mismo_valor_que_backend>
```

### Qué NO testear en E2E

- Flujo completo de magic link (requeriría leer emails). El login se testea en unitarios; en E2E se usa bypass de Clerk.
- Wizard de onboarding paso a paso con datos reales (muy lento, frágil). E2E cubre redirecciones y guards; el wizard se testea en unitarios.

### Comandos

```bash
pnpm test:e2e              # headless
pnpm test:e2e:ui           # modo interactivo
pnpm test:e2e -- --grep onboarding   # filtrar specs
```

## Cuándo NO escribir un test

- Renombrado de identifier sin cambio de behavior.
- Refactor con tests existentes que ya cubren el comportamiento.
- Cambios visuales sin lógica (eso se verifica en browser).

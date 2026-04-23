# fn-1.2 F.0b — Setup MSW + handlers + fixtures

## Description

Setup de Vitest para tests unitarios de la feature. Sin MSW — los tests de mutator y componentes usan stubs manuales o `vi.mock`.

- Verificar que `vitest.config.ts` tiene `jsdom` como environment.
- `src/test/setup.ts`: setup de `@testing-library/react` + cualquier global necesario.
- Confirmar que `axe-core` está disponible para a11y tests (`@axe-core/react` o `jest-axe` equivalente para Vitest).
- Exportar helper `renderWithProviders(ui)` en `src/test/utils.tsx` que wrappea con `QueryClientProvider` + `ClerkProvider` (con publishable key de test) + `RouterProvider` stub.
- Smoke test: un test que renderiza el botón de shadcn y verifica que axe no reporta violations.

## Acceptance

- [ ] `pnpm test` corre sin errores de setup.
- [ ] `renderWithProviders` disponible en `src/test/utils.tsx`.
- [ ] Axe-core disponible y el smoke test pasa.
- [ ] Typecheck OK.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

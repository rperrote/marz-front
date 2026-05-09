# fn-2.12 Fix BrandSessionContext mock in P1Input tests

## Description
`src/features/campaigns/brief-builder/screens/P1Input.test.tsx` mockea `#/features/identity/session/BrandSessionContext` reemplazando todo el módulo. Eso elimina el export real `BrandSessionContext`, pero `renderWithValidation` lo importa para renderizar `BrandSessionContext.Provider`, haciendo fallar los tests de `P1Input`.

Aplicar el fix técnico ya identificado: convertir ese mock en un mock parcial con `importOriginal`, preservando `BrandSessionContext` y sobreescribiendo solo `useBrandSession`.

## Acceptance
- [ ] `src/features/campaigns/brief-builder/screens/P1Input.test.tsx` preserva el export real `BrandSessionContext` en el mock.
- [ ] `pnpm vitest run src/features/campaigns/brief-builder/screens/P1Input.test.tsx` pasa.
- [ ] `pnpm lint` pasa.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

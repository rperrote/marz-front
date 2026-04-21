# fn-1.6 F.4 — Componentes reusables onboarding (shell/topbar/footer/progress/field/chips/cards)


## Description

Implementar los componentes reusables de onboarding (shared/ui dentro de `features/identity/onboarding/shared/`), mapeados 1:1 al pencil DS:

- `OnboardingShell` ← `OnbScreenShell` (hQXtH) — wrapper con topbar + contenido + footer.
- `OnboardingTopbar` ← `OnbTopbar` (4W3se) — prop `stepLabel: string`.
- `OnboardingProgress` ← `OnbProgress` (w7qmh) — prop `percent: number` (0-100).
- `OnboardingFooter` ← `OnbFooter` (KrwlG) — props `onBack?`, `onNext`, `nextDisabled?`, `nextLabel?`, `isLoading?`.
- `OnboardingField` ← `OnbField` (PcSW6) — label + hint + error + children.
- `OnboardingOptionChip` ← `OnbOptionChip` / `OnbOptionChipSelected` (fQBHs/mH8KA) — prop `selected: boolean`.
- `OnboardingVerticalCard` ← `OnbVerticalCard` / selected (NrZHg/UFDvW).
- `OnboardingContentTypeChip` ← `OnbContentTypeChip` / selected (xl1Zf/S1IXX).
- `OnboardingTierCard` ← `OnbTierCard` / selected (EQBOc/v4b1t).
- `OnboardingSectionTitle` ← `OnbSectionTitle` (oty0b).

Reglas:
- Usar tokens del `styles.css` (no hardcodear colores/radios/spacing).
- Props minimal; sin acoplamiento a dominio brand/creator.
- Accesibles por teclado: chips/cards son `role="radio"` o `role="checkbox"` según multi-select.
- `axe-core` clean.

Ubicación: `src/features/identity/onboarding/shared/components/`.

## Acceptance

- [ ] Los 10 componentes existen con tests (render + interacción básica).
- [ ] Storybook **NO requerido** (no hay Storybook en el repo). En su lugar, una ruta dev `/ds-onboarding` opcional que rendea todos en una grid para eyeballing. (Ver `src/routes/ds.tsx` existente como patrón.)
- [ ] Validación visual vs pencil: screenshots de cada componente comparados con `get_screenshot` de los IDs del DS. Aceptable ≥95%.
- [ ] `pnpm test` todos verde.
- [ ] Navegación por teclado funciona en chips/cards (Tab + Space).
- [ ] No hay strings hardcoded; los labels vienen por props.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
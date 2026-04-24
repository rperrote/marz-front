# fn-1.7 F.4 — Componentes reusables onboarding (shell/topbar/footer/progress/field/chips/cards)

## Description

Implementar los componentes reusables de onboarding, mapeados 1:1 al pencil DS.

Ubicación: `src/features/identity/onboarding/shared/components/`.

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
- Chips/cards son `role="radio"` o `role="checkbox"` según multi-select.
- axe-core clean.

## Acceptance

- [ ] Los 10 componentes existen con tests (render + interacción básica).
- [ ] Ruta dev `/ds-onboarding` opcional que renderiza todos en una grid (ver `src/routes/ds.tsx` como patrón).
- [ ] Validación visual vs pencil ≥95% (screenshots comparados con `get_screenshot` de los IDs del DS).
- [ ] `pnpm test` verde.
- [ ] Navegación por teclado: Tab + Space en chips/cards.
- [ ] No hay strings hardcoded; los labels vienen por props.

## Done summary

10 componentes reusables de onboarding implementados con tests, ruta /ds-onboarding, tokens CSS, navegación por teclado, axe-clean; lint/test/typecheck verde.

## Evidence

- Commits:
- Tests:
- PRs:

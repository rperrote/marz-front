# fn-2.1 F.0 — Lift wizard shells de onboarding a src/shared/ui/wizard/

## Description

# F.0 — Lift wizard shells a `src/shared/ui/wizard/`

## Por qué

`features/campaigns/` no puede importar de `features/identity/onboarding/shared/` (cross-context boundary, ver `marz-front/CLAUDE.md` §Reglas de organización). Los componentes shell del onboarding son genéricos (no conocen dominio identity), así que se mueven a `shared/ui/wizard/` y se renombran con prefijo `Wizard*`.

## Scope

Mover y renombrar:

| Antes                                                                    | Después                                |
| ------------------------------------------------------------------------ | -------------------------------------- |
| `src/features/identity/onboarding/shared/components/OnboardingShell.tsx` | `src/shared/ui/wizard/WizardShell.tsx` |
| `OnboardingProgress.tsx`                                                 | `WizardProgress.tsx`                   |
| `OnboardingFooter.tsx`                                                   | `WizardFooter.tsx`                     |
| `OnboardingTopbar.tsx`                                                   | `WizardTopbar.tsx`                     |
| `OnboardingField.tsx`                                                    | `WizardField.tsx`                      |
| `OnboardingSectionTitle.tsx`                                             | `WizardSectionTitle.tsx`               |

Componentes con dominio identity (`OnboardingOptionChip`, `OnboardingTierCard`, `OnboardingVerticalCard`, `OnboardingContentTypeChip`) **se quedan** en `features/identity/onboarding/shared/`.

Actualizar todos los callsites del onboarding a los nuevos paths/nombres. Tests de onboarding siguen verdes sin cambios de assertions (solo imports).

## Aproximación

1. `git grep -l Onboarding{Shell,Progress,Footer,Topbar,Field,SectionTitle}` para censo de callsites.
2. Mover archivos con `git mv`.
3. Renombrar los componentes y exports.
4. Find/replace de imports en onboarding (rutas + screens).
5. `pnpm typecheck && pnpm test` verde.

## Notas

- Mantener API pública igual (props, behavior). Es un rename, no un refactor.
- No tocar estilos. Tokens via `$--...` siguen igual.

## Acceptance

- 6 archivos movidos a `src/shared/ui/wizard/` con nombres `Wizard*`.
- Componentes con dominio identity NO se movieron.
- Todos los callsites de onboarding actualizados; `pnpm typecheck` verde.
- `pnpm test` verde sin cambios de assertions (solo imports).
- `git grep "OnboardingShell\|OnboardingProgress\|OnboardingFooter\|OnboardingTopbar\|OnboardingField\|OnboardingSectionTitle"` no devuelve matches en código (solo posiblemente en tests con strings ad-hoc, no como nombres de import).
- Sin cambios visuales (snapshot/screenshot manual de `/onboarding/brand` igual antes y después).

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

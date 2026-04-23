# fn-1.14 F.11 — 14 pantallas onboarding brand (B1-B14)

## Description

Implementar las 14 pantallas del onboarding brand (B1-B14).

Ubicación: `src/features/identity/onboarding/brand/screens/`.

| #   | Screen                  | Pencil node                           | Notas                                                                                                                                                                                               |
| --- | ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | `B1IdentityScreen`      | FhvET / B1-Identity                   | Inputs: `brand_name`, `website_url`. Debounce 500ms on URL change → `useBrandEnrichment`. Preview de logo + colores cuando hay data. Guarda `brandfetch_snapshot` en store. **Nunca** bloquea Next. |
| B2  | `B2VerticalScreen`      | OnbVerticalCard grid                  | 16 verticals. Single-select.                                                                                                                                                                        |
| B3  | `B3PrimingSocialProof`  | —                                     | Sin input, copy + ilustración. Next always enabled.                                                                                                                                                 |
| B4  | `B4ObjectiveScreen`     | OnbVerticalCard (4)                   | 4 opciones (awareness/performance/launch/community).                                                                                                                                                |
| B5  | `B5ExperienceScreen`    | OnbOptionChip (2 grupos)              | `creator_experience` (3 chips) + `creator_sourcing_history` (string fijo según diseño).                                                                                                             |
| B6  | `B6BudgetScreen`        | Slider                                | 4 snaps → mapea a enum (`zero`, `under_10k`, `10k_to_25k`, `25k_to_50k`, `50k_plus`).                                                                                                               |
| B7  | `B7PrimingMatchPreview` | —                                     | Sin input.                                                                                                                                                                                          |
| B8  | `B8TimingScreen`        | OnbOptionChip (4)                     | timing enum.                                                                                                                                                                                        |
| B9  | `B9ContactScreen`       | 3 inputs                              | `contact_name`, `contact_title`, `contact_whatsapp_e164` con máscara. Validación E.164 (`^\+[1-9]\d{7,14}$`).                                                                                       |
| B10 | `B10PrimingProjection`  | —                                     | Sin input.                                                                                                                                                                                          |
| B11 | `B11AttributionScreen`  | OnbOptionChip (8) + input condicional | Si source=`referral` → input "¿Quién te recomendó?" requerido.                                                                                                                                      |
| B12 | `B12LoadingScreen`      | animation                             | `setTimeout(2500)` → avanza solo.                                                                                                                                                                   |
| B13 | `B13PaywallScreen`      | OnbPaywallCard (h0bnQ)                | CTA "Start trial" disabled con tooltip "Próximamente"; botón "Continuar sin suscribirme" avanza.                                                                                                    |
| B14 | `B14ConfirmationScreen` | copy + CTA                            | Botón "Empezar" → trigger de fn-1.15.                                                                                                                                                               |

Reglas:

- Todas usan `OnboardingShell`, `OnboardingTopbar` (stepLabel "Paso N de 14"), `OnboardingProgress` (N/14\*100), `OnboardingFooter`.
- Validación local por paso antes de habilitar Next. Cross-field (referral_text con attribution=referral) valida al salir del paso.
- Guarda en store al cambiar (no al Next).
- Analytics: `onboarding_step_entered` on mount, `onboarding_step_completed` on Next válido.
- Strings vía Lingui (`t`).

## Acceptance

- [ ] Las 14 pantallas existen en `screens/`.
- [ ] Cada una tiene test unitario de render + validación.
- [ ] Happy path e2e: recorrer los 14 pasos con datos válidos → store tiene payload completo.
- [ ] B1 enrichment: debounce funciona; logo preview aparece si el endpoint devuelve data; no bloquea si 204/error.
- [ ] B6 slider mapea correcto a enum.
- [ ] B9 WhatsApp valida E.164.
- [ ] B11 referral condicional funciona.
- [ ] B12 avanza solo a los 2.5s.
- [ ] Axe-core clean en todas.
- [ ] Validación visual vs pencil ≥95% (pantallas clave: B1, B2, B6, B11, B13).
- [ ] Strings extraídos en catálogo Lingui.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

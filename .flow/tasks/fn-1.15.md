# fn-1.15 F.12 — Trigger final brand (useCompleteBrandOnboarding)


## Description

Trigger final del onboarding brand — B14 botón "Empezar" dispara `useCompleteBrandOnboarding`.

- Wire del botón en `B14ConfirmationScreen`.
- Mutation:
  - Construye payload completo desde `useBrandOnboardingStore.getState()` (Zod parse del schema generado antes de enviar, para fallar loud si falta algo).
  - Loading state en botón.
  - On success:
    - Limpia store (`reset()`).
    - Invalida `useMe`.
    - Navigate a home brand (`/campaigns` o lo que haya como home stub en `_brand`).
    - Analytics `onboarding_completed` con kind=brand.
  - On 422 `validation_failed`: mapea `field_errors` a mensajes inline y navega al primer paso con error.
  - On 409 `invalid_state`: refetch `useMe` + navigate a `redirect_to` (recovery).
  - Otros errores: toast genérico + mantener en B14 (botón re-habilita).

## Acceptance

- [ ] Happy path brand e2e: recorrer los 14 pasos con mock MSW → B14 → submit → 200 → home brand.
- [ ] 422 con `field_errors` en `vertical` → navega a B2 y muestra error inline.
- [ ] 409 `invalid_state` → refetch `useMe` + navigate sin loop.
- [ ] Error genérico (500) → toast + botón re-clickeable.
- [ ] Store limpiado en success (sessionStorage ya no tiene `marz-brand-onboarding`).
- [ ] Analytics fire.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
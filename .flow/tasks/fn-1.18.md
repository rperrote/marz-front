# fn-1.18 F.15 — Trigger final creator (useCompleteCreatorOnboarding)

## Description

Trigger final del onboarding creator — C20 botón "Empezar" dispara `useCompleteCreatorOnboarding`.

- Wire del botón en `C20ConfirmationScreen`.
- Mutation:
  - Payload desde `useCreatorOnboardingStore.getState()`.
  - Zod parse con `CreatorOnboardingPayloadSchema` de `src/features/identity/onboarding/creator/schema.ts` antes de enviar. Si falla, mostrar error genérico y navigate al primer paso con issue (no enviar request).
  - On success: reset store + invalidate `useMe` + navigate a home creator (`/offers`).
  - On 409 `handle_taken`: navigate a C1 con error inline en field `handle`.
  - On 422 `validation_failed`: navigate al primer paso con `field_errors`.
  - On 422 `avatar_not_found`: navigate a C17 con mensaje "subí la foto de nuevo".
  - On 409 `invalid_state`: refetch `useMe` + navigate a `redirect_to`.

## Acceptance

- [ ] Happy path creator e2e: recorrer 20 pasos → C20 → submit → 200 → home creator.
- [ ] `handle_taken` → navega a C1, campo handle highlighted con error.
- [ ] `avatar_not_found` → navega a C17 con mensaje.
- [ ] `validation_failed` cualquier otro field → navega al paso correspondiente.
- [ ] Store limpiado en success.
- [ ] Analytics `onboarding_completed` fire.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

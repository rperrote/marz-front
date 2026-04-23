# fn-1.16 F.13 — Layout /onboarding/creator + store Zustand + máquina de pasos

## Description

Análogo a fn-1.13 pero para creator. 20 pasos.

- `src/routes/onboarding/creator.tsx` — layout.
- `src/routes/onboarding/creator.$step.tsx`.
- `src/features/identity/onboarding/creator/store.ts` — Zustand + sessionStorage SSR-safe (mismo patrón que fn-1.13: wrapper `typeof window` check + `skipHydration: true` + rehidratación manual), key `marz-creator-onboarding`.
- `src/features/identity/onboarding/creator/steps.ts` — los 20 pasos.
- `src/features/identity/onboarding/creator/schema.ts` — schema Zod compartido con refinements cross-field. Ver fn-1.17 para el detalle completo.

Steps:
C1 `name-handle`, C2 `experience`, C3 `priming-brands-waiting`, C4 `tier`, C5 `niches`, C6 `content-types`, C7 `channels`, C8 `priming-testimonials`, C8b `priming-benchmark`, C9 `priming-benchmark-2`, C10 `best-videos`, C11 `birthday`, C12 `gender`, C13 `location`, C14 `priming-numbers`, C15 `whatsapp`, C16 `referral`, C17 `avatar`, C18 `priming-earnings`, C19 `priming-social-proof`, C20 `confirmation`.

Guard:

- Session + `kind === 'creator'` + `onboarding_status === 'onboarding_pending'`.

## Acceptance

- [ ] Back/Next navega entre los 20 pasos.
- [ ] Refresh preserva estado.
- [ ] Cerrar tab limpia sessionStorage.
- [ ] Guard redirige si estado no coincide.
- [ ] URL refleja paso.
- [ ] SSR (`pnpm build && pnpm start`) no crashea en `/onboarding/creator/*`.
- [ ] F5 preserva data tras `rehydrate()` client-side.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

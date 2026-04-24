# fn-1.5 F.A — Wrapper de analytics cliente

## Description

Wrapper de analytics cliente — `src/shared/analytics/track.ts`.

El solution doc §10.5 lista los eventos que cada pantalla/flow debe emitir. El endpoint real (`POST /v1/analytics/events`) es de una feature futura; este epic solo provee el wrapper para que las call sites no cambien después.

- Función `track(event, payload?)` que:
  - Hace `console.debug('[analytics]', event, payload)` en dev.
  - Incrementa un counter in-memory (array) para tests.
  - No-op en prod hasta que el endpoint real exista.
- Tipado: el set de event names es un union literal string:
  - `magic_link_requested`, `magic_link_succeeded`, `magic_link_failed`
  - `kind_selected`
  - `onboarding_step_entered`, `onboarding_step_completed`, `onboarding_abandoned`, `onboarding_completed`
  - `sign_in_succeeded`, `sign_out`
  - `onboarding_redirect_enforced`
- `beforeunload` listener global que dispara `onboarding_abandoned` si hay data en algún onboarding store y no está `onboarded` — best-effort.

## Acceptance

- [ ] Wrapper tipado con union literal strings.
- [ ] Se puede importar desde cualquier feature sin ciclos.
- [ ] Test: llamar `track('kind_selected', { kind: 'brand' })` registra el evento en el spy.
- [ ] `beforeunload` listener registra `onboarding_abandoned` cuando corresponde.
- [ ] En prod, el wrapper no rompe ni fuga info.

## Done summary

Wrapper de analytics tipado con no-op en prod, tests cubriendo track y beforeunload, listener global instalado en root.

## Evidence

- Commits:
- Tests:
- PRs:

# fn-1.10 F.7 — Ruta /auth/link-invalid + MagicExpiredScreen


## Description

Ruta `/auth/link-invalid` + componente `MagicExpiredScreen` — landing cuando Clerk rechaza el link.

- Archivo: `src/routes/auth/link-invalid.tsx`.
- Componente: `src/features/identity/auth/components/MagicExpiredScreen.tsx`.
- Visual: `P-MagicExpired` (duxRv) del pencil.
- CTA "Pedí un nuevo link" → redirect a `/auth` con clear state.
- Analytics: emitir `magic_link_failed` en mount.

## Acceptance

- [ ] Renderiza pantalla con CTA que navega a `/auth`.
- [ ] Analytics `magic_link_failed` fire al mount.
- [ ] Axe-core clean.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
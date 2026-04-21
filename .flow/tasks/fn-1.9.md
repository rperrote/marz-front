# fn-1.9 F.6 — Ruta /auth/check-email + MagicSentScreen


## Description

Ruta `/auth/check-email` + componente `MagicSentScreen` — instrucción "revisá tu email" post-submit.

- Archivo: `src/routes/auth/check-email.tsx`.
- Componente: `src/features/identity/auth/components/MagicSentScreen.tsx`.
- Visual: `P-MagicSent` (vbSxI / MsrrO) del pencil.
- Lee email desde search param o Zustand transient store del flow auth.
- Botón "Reenviar link":
  - Cooldown visible (60s, configurable). Disabled durante cooldown con contador.
  - Invoca Clerk resend (e.g., `signIn.prepareFirstFactor({ strategy: 'email_link', ... })`).
- Link "Usar otro email": clear del state + navigate a `/auth`.
- Sin email disponible: redirect a `/auth`.

## Acceptance

- [ ] Renderiza email del paso anterior.
- [ ] Cooldown del botón reenviar funciona (timer).
- [ ] Reenvío dispara analytics `magic_link_requested` (reuso track).
- [ ] "Usar otro email" limpia state y navega a `/auth`.
- [ ] Acceso directo a `/auth/check-email` sin email → redirect a `/auth`.
- [ ] Axe-core clean.

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
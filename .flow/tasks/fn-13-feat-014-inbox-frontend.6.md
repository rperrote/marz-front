---
satisfies: [R6, R7]
---

## Description

Cablear `navigation_action` de cada item para abrir el flujo completo correspondiente (Workspace conversation, Video reviewer, Deliverable upload, Discovery, Creator profile, Campaign) usando el `href` canónico que entrega backend. Agregar `analytics.ts` y emitir los eventos del Inbox (sin PII). E2E happy path opcional cuando seed de backend dev esté disponible.

**Size:** M
**Files:**

- `src/features/inbox/InboxItemRow.tsx` (modificado: cablea `navigation_action` como CTA principal)
- `src/features/inbox/analytics.ts` (nuevo)
- `src/features/inbox/InboxPage.tsx` (modificado: emite `inbox_viewed`, `inbox_filter_changed`, `inbox_refreshed`, `inbox_marked_read_bulk`, `inbox_empty_viewed`)
- `src/features/inbox/InboxItemRow.tsx` (modificado: emite `inbox_item_opened`, `inbox_item_marked_read`)
- `src/features/inbox/InboxInlineActionPopover.tsx` (modificado: emite `inbox_inline_started`, `inbox_inline_completed`, `inbox_inline_failed`)

## Approach

- `navigation_action.href` es path canónico que el Router de marz-front debe conocer (ej. `/workspace/conversations/{id}`, `/campaigns/{id}/applications/{id}`, etc.). Usar `<Link to={href}>` o `useNavigate`.
- Si Router no conoce el path: mostrar toast "Esta sección todavía no está disponible" y NO romper. No asumir rutas que no existen — depende de FEAT-013/Workspace estar deployado.
- `analytics.ts` exporta `track(event, payload)` que delega al provider existente del repo (buscar en `src/shared/analytics/` o equivalente). Si no existe provider central, crear stub con TODO y emitir a console en dev.
- Eventos: `inbox_viewed`, `inbox_filter_changed`, `inbox_refreshed`, `inbox_item_opened`, `inbox_inline_started`, `inbox_inline_completed`, `inbox_inline_failed`, `inbox_item_marked_read`, `inbox_marked_read_bulk`, `inbox_empty_viewed`.
- Payload debe llevar `account_kind`, `item_kind`, `section`, `campaign_id` (si aplica). NO incluir preview, message text, counterpart name, ni avatar URL.
- E2E (Playwright): si seed de dev está disponible, happy path de creator que recibe offer y la acepta inline; brand viendo empty state. Si no, dejar test `skip` con TODO.

## Investigation targets

**Required:**

- `src/shared/analytics/` o equivalente — provider de analytics existente (Posthog/Amplitude/etc.)
- `src/routes/` — paths canónicos registrados (workspace, campaigns, etc.)
- `marz-docs/features/FEAT-014-inbox/03-solution.md` §7.4 task F.6

**Optional:**

- `playwright/` o `e2e/` — setup de tests existente

## Acceptance

- [ ] Click en row sin inline actions navega a `navigation_action.href`.
- [ ] Si el path no está registrado en Router: toast neutro, sin crash.
- [ ] `inbox_viewed` se emite al entrar; `inbox_empty_viewed` cuando ambas secciones están vacías.
- [ ] Filter change, refresh, mark-read individual y bulk emiten sus eventos.
- [ ] Inline action emite `started` antes y `completed`/`failed` después.
- [ ] Ningún payload de analytics contiene preview, message text, display name, ni URLs.
- [ ] E2E happy path corre verde (o queda `skip` con TODO si seed no disponible).
- [ ] Smoke manual: brand y creator navegan desde un item a su flujo destino real.

## Done summary
Implementación correcta: navegación con fallback toast, analytics sin PII, tests pasando, typecheck limpio. isKnownRouterHref duplicado en EmptyState e ItemRow pero es deuda cosmética, no un bloqueo.
## Evidence
- Commits:
- Tests:
- PRs:
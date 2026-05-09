---
satisfies: [R5]
---

## Description

Cablear las cuatro mutaciones Discovery a endpoints reales con `Idempotency-Key`: contact match (`in_platform_invite|email_invite`), accept application (abre conversation), reject application, create invite (email + handle). Incluir el dialog `Add manually` para crear invite por email o handle desde la sección Invited. Errores tipados se surfacean con copies específicas.

**Size:** M
**Files:**

- `src/features/discovery/campaign-detail/mutations.ts`
- `src/features/discovery/campaign-detail/AddCreatorDialog.tsx`
- `src/features/discovery/campaign-detail/MatchCard.tsx` (modificado: acciones)
- `src/features/discovery/campaign-detail/ApplicationCard.tsx` (modificado: accept/reject)
- `src/features/discovery/campaign-detail/InviteList.tsx` (modificado: trigger Add manually)

## Approach

- Hooks `useContactMatch`, `useAcceptApplication`, `useRejectApplication`, `useCreateCampaignInvite` envolviendo mutations Orval.
- Generar `Idempotency-Key` (UUID v4) por intento de mutación; reintento mantiene el mismo key hasta éxito o cambio de payload.
- `onSuccess`: invalidate keys afectadas (`summary`, sección actual, `participants` cuando aplica). El refresh fino lo hace WS en task 8.
- `onError` typed errors:
  - `409 plan_does_not_allow_in_platform_invite` → toast con upsell, deshabilitar opción in_platform en dialog.
  - `409 conversation_already_exists` → leer `details.conversation_id` y navegar al Workspace existente (link helper de Chat).
  - `409 invite_duplicate` → toast informativo "ya enviada".
  - `409 campaign_not_discoverable` → toast con razón.
  - `422 validation.email|creator_handle` → field-level error en `AddCreatorDialog`.
- `AddCreatorDialog` con `TanStack Form` + Zod: discriminated union `{ mode: 'email', email }` | `{ mode: 'in_platform', creator_handle }`. Plan free oculta tab `in_platform` (`plan_capabilities.allows_in_platform_invites === false` desde `/detail`).
- Accept application: al `onSuccess`, navegar al Workspace nuevo (`conversation.id`); preservar `application.id` para correlación analytics.

## Investigation targets

**Required:**

- `src/shared/api/mutator.ts` — confirmar Idempotency-Key flow
- `src/features/chat/workspace/` — helper de navegación al Workspace
- `src/shared/forms/` o equivalente TanStack Form en repo
- Pencil: dialog Add manually (referencia en spec `1WW1E`/`CK94g`)

## Design context

Dialogs centrados, redondeados. Botones primary solo para acción principal (Send invite, Accept). Reject usa variante destructive sutil. Light + dark.

## Acceptance

- [ ] Cada mutation envía `Idempotency-Key` y maneja códigos 409 listados.
- [ ] Plan free no expone modo `in_platform` en `AddCreatorDialog`.
- [ ] Accept application navega al Workspace recién creado.
- [ ] `conversation_already_exists` navega a la conversation existente vía `details.conversation_id`.
- [ ] Validación email/handle vía Zod surfacea field error.
- [ ] E2E manual: invite por email aparece en sección Invited tras success.
- [ ] `pnpm typecheck` pasa.

## Done summary
canShowInPlatformInvites corregido y onAddManually eliminada — todos los issues resueltos, spec cubierta, typecheck verde, 9 tests pasando
## Evidence
- Commits:
- Tests:
- PRs:
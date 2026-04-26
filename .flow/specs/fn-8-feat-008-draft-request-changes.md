# FEAT-008: Draft Request Changes & Versioning — Frontend

## Overview

Materializa la rama "request changes" del lifecycle del Deliverable en `marz-front`. Cuando un Brand owner ve un draft enviado (`draft_submitted`), puede pedir cambios eligiendo categorías predefinidas + nota; eso genera una `RequestChangesCard` inmutable en la timeline del chat y deshabilita "Approve". El creator entonces sube v(n+1) usando el flujo two-phase existente de FEAT-007 (sin cambios de contrato; solo se afloja el guard de status). El panel lateral derecho expone el listado completo de versiones del Draft con play por versión.

Esta epic cubre **solo frontend** (`marz-front`). El backend (endpoints `POST /deliverables/{id}/request-changes`, `GET /deliverables/{id}/change-requests`, extensión de `DeliverableDTO`, evento WS `changes.requested`) vive en `marz-api` y se consume vía `pnpm api:sync` cuando esté disponible en dev.

Spec fuente: `marzv2/marz-docs/features/FEAT-008-draft-request-changes/03-solution.md` (§4 contrato, §7 plan frontend).

## Scope

**In scope (frontend):**

- Sync de tipos via Orval contra el contrato del backend FEAT-008.
- 4 componentes nuevos: `RequestChangesModal`, `RequestChangesCard`, `DraftVersionList`, `ChangeCategoryChip`.
- Extensiones a 5 componentes existentes: `DraftSubmittedCard`, `Timeline`, `DeliverableListPanel`, `UploadDraftDialog`, `ws/handlers`.
- Hook `useRequestChangesFlow` (orquesta validación + Idempotency-Key + mutation).
- WS handler para `'changes.requested'` (invalidaciones React Query).
- 7 analytics events client-side.
- E2E del flujo completo (single offer): brand pide cambios → card aparece en ambas pestañas → creator sube v2 → brand aprueba.

**Out of scope:**

- Cambios en `marz-api`. Se asume backend mergeado y deployado en dev antes de F.1.
- MSW handlers (FEAT-008 corre contra dev real, sin mocks).
- Edición de un `ChangeRequest` (snapshot inmutable por diseño).
- Comments granulares anclados a timestamp del video (fuera de MVP).
- Notifications externas (in-app via chat es la única superficie).

## Approach

1. **Contrato primero.** F.1 corre `pnpm api:sync` contra dev backend con FEAT-008 ya levantado. Esto regenera `src/shared/api/generated/` con los hooks `useRequestChangesMutation`, `useListChangeRequestsQuery`, los tipos `ChangeRequestDTO`, `ChangeCategory`, `ChangesRequestedSnapshot` y la extensión de `DeliverableDTO` (slots `drafts[]`, `change_requests_count`, `latest_change_request`). Suma `'changes.requested'` al union `DomainEventEnvelope` en `src/shared/ws/types.ts`.
2. **Modal + hook.** F.2 implementa `RequestChangesModal` + `ChangeCategoryChip` + hook `useRequestChangesFlow` con validación client-side (≥1 categoría; si `Other` ∈ categorías → notas no vacías) y generación de `Idempotency-Key` UUID v4 por apertura.
3. **Cards + timeline.** F.3 implementa `RequestChangesCard` (saliente brand / entrante creator), agrega branching en `Timeline` para `event_type='ChangesRequested'`, y extiende `DraftSubmittedCard` con botón "Request changes" (visible solo para Brand owner sobre la versión actual; deshabilitado en cards no-actuales con copy "A newer version was submitted").
4. **Panel lateral + history.** F.4 agrega `DraftVersionList` dentro de `DeliverableListPanel` consumiendo `drafts[]` directamente del DTO (sin refetch). Deshabilita "Upload draft v(n+1)" con copy condicional según status.
5. **WS live updates.** F.5 completa el case `'changes.requested'` en `ws/handlers.ts` invalidando `['conversation-deliverables', cid]`, `['conversation-messages', cid]`, `['change-requests', deliverableId]`. Verifica regresión de `'draft.submitted'` para v(n+1).
6. **Analytics.** F.6 instrumenta los 7 eventos del §10 spec via el endpoint genérico `POST /api/v1/analytics/events` (FEAT-002).

**Reuse points (centralizados, no reescribir):**

- `src/shared/api/mutator.ts` — auth/errors/abort para todas las mutations (FEAT-001).
- `src/features/deliverables/hooks/useDraftUploadFlow.ts` — flow two-phase de upload (FEAT-007). Lo usa el creator para subir v(n+1) sin cambios.
- `src/shared/ws/useWebSocket.ts` — hook WS tipado con `DomainEventEnvelope<T>` (FEAT-003/004).
- `src/shared/ui/wizard/` — primitives de modal (lift de FEAT-002).
- `src/components/ui/*` — shadcn primitives (no editar).
- Tokens de `src/styles.css` (mapeados desde `marz-design/marzv2.pen`); usar utilities Tailwind v4, no hardcodear.

## Quick commands

```bash
# Regenerar tipos contra dev (requiere backend FEAT-008 mergeado en dev)
pnpm api:sync

# Validación local
pnpm tsc --noEmit
pnpm lint
pnpm test --run
pnpm test:e2e tests/e2e/feat008/

# Smoke manual: levantar dev + abrir conversation con un draft submitted
pnpm dev
```

## Acceptance

- **R1:** El brand owner puede abrir un modal "Request changes" desde una `DraftSubmittedCard`, seleccionar ≥1 categoría (`product_placement`, `pacing`, `audio`, `disclosure_code`, `other`), opcionalmente escribir una nota, y enviar. Si elige `other`, las notas son obligatorias. El submit está deshabilitado mientras esas reglas no se cumplen.
- **R2:** Tras un submit exitoso, una `RequestChangesCard` inmutable aparece en la timeline del chat para ambos lados (brand + creator) en vivo (sin reload), renderizando: versión referenciada, categorías, nota (o vacío), timestamp, miniatura del draft.
- **R3:** El creator, con el deliverable en `changes_requested`, puede subir v(n+1) usando el flujo existente de upload (sin cambios de contrato). Tras `complete`, una nueva `DraftSubmittedCard` aparece para v(n+1) y la `RequestChangesCard` previa queda inmutable arriba en la timeline.
- **R4:** El panel lateral derecho de cada deliverable lista todas las versiones del Draft (v1, v2, …, vN) con badge de estado por versión (`submitted`/`changes_requested`/`approved`), botón de play (signed URL del backend) y marca explícita "current" en la última. El botón "Upload draft v(n+1)" del panel se habilita solo cuando `status='changes_requested'`; en otros estados está deshabilitado con copy condicional ("Waiting for brand review" en `draft_submitted`, "Draft already approved" en `draft_approved`).
- **R5:** El botón "Request changes" en una `DraftSubmittedCard` está visible solo para el Brand owner. Se deshabilita con copy "A newer version was submitted" cuando llega un WS `draft.submitted` con `version > shown_version`. Se oculta cuando `status` ≠ `draft_submitted`.
- **R6:** El WS event `'changes.requested'` invalida correctamente las queries `['conversation-deliverables', cid]`, `['conversation-messages', cid]`, `['change-requests', deliverableId]`. El WS event `'draft.submitted'` (existente) sigue funcionando para v(n+1) sin regresión.
- **R7:** Los 7 analytics events del §10 (`request_changes_modal_opened`, `_dismissed`, `change_request_submitted`, `request_changes_card_seen`, `draft_v2_upload_started`, `time_to_resolve_round`, `deliverable_total_rounds`) se disparan con los payloads exactos de la spec. No se trackean textos libres (notas, filenames).
- **R8:** Errores tipados del backend (409 `change_request_already_exists`, 422 `validation_error`, 403 `forbidden_role`) se mapean a estados de UI claros en el modal sin perder los datos ya tipeados por el usuario.
- **R9:** Validación visual Pencil ≥95% contra los frames declarados en spec (`EJfv5`, `nTTdM`, `a4UgN`, `txulr`, `nK6FB`, `H2DA6`, `y54vb`, `Xu3OI`, `BIuqZ`) en light + dark. `DraftVersionList` queda con frame pendiente y diseño ad-hoc usando tokens del design system.
- **R10:** A11y del modal: foco atrapado, ESC cierra, chips son `role="button"` con `aria-pressed`, textarea con `aria-describedby` que apunta al mensaje de validación cuando `Other` está sin notas.
- **R11:** E2E Playwright `tests/e2e/feat008/request-changes-single.spec.ts` cubre el flujo completo (request → v2 → approve) en una offer `single`. E2E `tests/e2e/feat008/draft-version-history.spec.ts` cubre 3 rondas y verifica histórico reproducible.

## Early proof point

Task `fn-8-feat-008-draft-request-changes.2` (modal + hook + chip) valida el corazón del flow: validación client-side correcta, integración con el mutation generado por Orval, y manejo de errores tipados del backend. Si esto falla, hay que reconsiderar la estructura de validación (mover validación a Zod schema vs. lógica imperativa) o el contrato con el backend antes de continuar con cards/panel.

## Requirement coverage

| Req | Description                                                   | Task(s)                                                                                                             | Gap justification                                  |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| R1  | Modal con validación de categorías + notas (other → required) | fn-8-feat-008-draft-request-changes.2                                                                               | —                                                  |
| R2  | RequestChangesCard live en timeline ambos lados               | fn-8-feat-008-draft-request-changes.3, fn-8-feat-008-draft-request-changes.5                                        | —                                                  |
| R3  | Upload v(n+1) desde changes_requested                         | fn-8-feat-008-draft-request-changes.4                                                                               | Reusa `useDraftUploadFlow` de FEAT-007 sin cambios |
| R4  | DraftVersionList en panel lateral + Upload button condicional | fn-8-feat-008-draft-request-changes.4                                                                               | —                                                  |
| R5  | Botón "Request changes" condicional por rol/versión/status    | fn-8-feat-008-draft-request-changes.3                                                                               | —                                                  |
| R6  | WS handler `changes.requested` + regresión `draft.submitted`  | fn-8-feat-008-draft-request-changes.5                                                                               | —                                                  |
| R7  | 7 analytics events client-side                                | fn-8-feat-008-draft-request-changes.6                                                                               | —                                                  |
| R8  | Mapeo de errores backend a UI states                          | fn-8-feat-008-draft-request-changes.2                                                                               | —                                                  |
| R9  | Validación visual Pencil ≥95%                                 | fn-8-feat-008-draft-request-changes.2, fn-8-feat-008-draft-request-changes.3, fn-8-feat-008-draft-request-changes.4 | DraftVersionList sin frame pendiente               |
| R10 | A11y modal                                                    | fn-8-feat-008-draft-request-changes.2                                                                               | —                                                  |
| R11 | E2E Playwright (single + history)                             | fn-8-feat-008-draft-request-changes.3, fn-8-feat-008-draft-request-changes.4                                        | —                                                  |

## References

- Spec: `marz-docs/features/FEAT-008-draft-request-changes/03-solution.md` (§4 contrato, §7 plan frontend, §10 analytics, §11 riesgos)
- Spec negocio: `marz-docs/features/FEAT-008-draft-request-changes/02-spec.md`
- FEAT-007 (base): epic upstream con `Deliverable`/`Draft`/`DraftSubmittedCard`/`useDraftUploadFlow`
- FEAT-003/004: `DomainEventEnvelope`, Timeline, ConversationRail
- `marz-front/CLAUDE.md` §Cliente API (Orval), §WebSocket, §Tokens y tema
- `marz-front/src/shared/api/mutator.ts`, `marz-front/src/shared/ws/useWebSocket.ts`

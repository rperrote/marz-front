# FEAT-007: Draft Submit & Review (approve path) — Frontend

## Overview

Implementa el flujo `submit + approve` del primer ciclo de vida de un `Deliverable` (de `pending` a `draft_approved`) en `marz-front`. Cubre:

- Two-phase upload del video direct browser→S3 (intent + PUT pre-signed + complete) con progreso, cancelación y error states.
- Aprobación de drafts por el Brand owner (`POST /deliverables/{id}/approve`).
- Panel lateral derecho del Workspace con la lista de Deliverables (single / bundle / multistage).
- Reusa `DraftSubmittedCard` y `DraftApprovedCard` (placeholders ya en código) conectándolos al snapshot real del system_event.
- WS handlers para `draft.submitted`, `draft.approved`, `deliverable.changed`, `stage.approved` con invalidaciones de TanStack Query.
- Analytics events client-side via `POST /api/v1/analytics/events`.

Sin rutas nuevas. Reusa `src/routes/_brand/workspace/$conversationId.tsx` y `src/routes/_creator/workspace/$conversationId.tsx` (FEAT-003). Todos los componentes nuevos viven en `src/features/deliverables/components/`.

## Scope

**In:**

- 5 componentes nuevos: `UploadDraftDialog`, `UploadProgressOverlay`, `UploadErrorBanner`, `InlineVideoPlayer`, `ApproveDraftButton`, `DeliverableListPanel`.
- Hook custom `useDraftUploadFlow` que orquesta intent → PUT con XHR (para progress) → complete.
- Conexión real de `DraftSubmittedCard` y `DraftApprovedCard` al payload del system_event (hoy son placeholders).
- Branching en `Timeline.tsx` (FEAT-004) para `event_type: 'DraftSubmitted' | 'DraftApproved'`.
- WS handlers en `src/shared/ws/handlers.ts` (4 event types nuevos).
- Analytics helpers en `src/features/deliverables/analytics.ts` (8 eventos).
- Regen de Orval (`pnpm api:sync`) tras backend B.6 deploy en dev.

**Out:**

- `changes_requested` (rejection path) → fuera de FEAT-007.
- Thumbnail server-side (no ffmpeg en MVP).
- Resumable / multipart upload (rechazado en §12 D1).
- Notifications context (mismo criterio que features previas).
- E2E con backend mockeado (sin MSW; se corre contra dev real).

## Approach

**Two-phase upload (creator):**

1. `useDraftUploadFlow` valida client-side (formato/tamaño) → `useRequestDraftUploadMutation()` (paso 1).
2. Hook usa `XMLHttpRequest` (no `fetch` — no expone `progress` en upload) para hacer `PUT upload_url` con `Content-Type` + `x-amz-meta-deliverable` headers firmados. Reporta `progress` 0-100%. Soporta `abort()`.
3. Al `loadend` exitoso → `useCompleteDraftUploadMutation()` (paso 2). En error → `UploadErrorBanner` con causa tipada.
4. Cancelación: `xhr.abort()` + `useCancelDraftUploadMutation()` (best-effort backend cleanup).

**Approve (brand owner):**

- `ApproveDraftButton` solo visible si `session.role === 'owner'` y la `version` del card es la `current_version` del deliverable.
- Se deshabilita con copy "A newer version was submitted" cuando llega WS `draft.submitted` con versión más nueva (cliente-side check post-invalidate).

**Panel lateral:**

- `useGetConversationDeliverablesQuery` cargado en el `loader` de las rutas Workspace para SSR-friendly initial render.
- Para `multistage`: agrupa por `stages[]`, deshabilita "Upload draft" para stages en estado `locked`.

**WS / cache:**

- `draft.submitted` / `draft.approved` → invalidate `['conversation-deliverables', conversationId]` + `['conversation-messages', conversationId]`.
- `deliverable.changed` → `setQueryData` optimista (evita flash).
- `stage.approved` → invalidate `['conversation-deliverables', ...]` + `['offer', offerId]` (FEAT-006).

**Reuse points (verificados existentes en repo):**

- `DraftSubmittedCard` y `DraftApprovedCard` ya existen como placeholders en `src/features/deliverables/components/` (creados por FEAT-003).
- `Timeline.tsx` (FEAT-004) tiene un switch sobre `event_type` que se extiende.
- `mutator.ts` de Orval ya maneja auth bearer + `ApiError` tipado.
- Tokens del `.pen` ya están en `src/styles.css` mapeados a shadcn naming.
- `useWebSocket` hook con `DomainEventEnvelope<T>` ya existe (FEAT-003) — solo se agregan event types al discriminated union.

## Quick commands

```bash
# Regenerate API client + types from dev backend
pnpm api:sync

# Type-check
pnpm tsc --noEmit

# Unit tests
pnpm test src/features/deliverables

# E2E (cuando exista la suite de FEAT-007)
pnpm exec playwright test tests/e2e/feat007/

# Dev server
pnpm dev
```

## Acceptance

- **R1:** Tras `pnpm api:sync`, `src/shared/api/generated/` expone hooks `useRequestDraftUploadMutation`, `useCompleteDraftUploadMutation`, `useCancelDraftUploadMutation`, `useApproveDraftMutation`, `useGetConversationDeliverablesQuery`, `useListDraftsQuery` con sus tipos Zod. `pnpm tsc --noEmit` pasa.
- **R2:** El creator puede abrir `UploadDraftDialog` desde un deliverable `pending`/`draft_submitted`, elegir un archivo `video/mp4|quicktime|webm` ≤ 2GB, ver progreso 0-100%, cancelar mid-upload, y ante un `complete` exitoso cerrar el dialog. Validación client-side rechaza `.zip` y archivos > 2GB con `UploadErrorBanner`.
- **R3:** En la timeline del Brand, tras un submit, aparece el `DraftSubmittedCard` con `InlineVideoPlayer` reproduciendo el video desde `playback_url`. El Brand owner ve `ApproveDraftButton`; click dispara `useApproveDraftMutation` → la card de approval (`DraftApprovedCard`) aparece después.
- **R4:** El panel lateral derecho del Workspace lista los `Deliverable` de la current offer con su `status` y `current_version`. Para `multistage`, agrupa por `Stage` y deshabilita "Upload draft" para stages `locked`.
- **R5:** Los 4 WS event types (`draft.submitted`, `draft.approved`, `deliverable.changed`, `stage.approved`) se manejan en `src/shared/ws/handlers.ts`: la UI se actualiza en vivo sin reload (verificado en E2E con dos pestañas brand).
- **R6:** En `multistage`, aprobar el último deliverable de un stage activo desencadena (vía WS `stage.approved` + `stage.opened`) la apertura del siguiente stage en el panel lateral, sin reload.
- **R7:** El botón "Approve" se deshabilita con copy "A newer version was submitted" cuando llega WS `draft.submitted` con versión > la actualmente renderizada.
- **R8:** Los 8 analytics events (`upload_started`, `upload_progress`, `upload_completed`, `upload_failed`, `draft_submitted_card_seen`, `draft_player_played`, `draft_approved`, `multistage_stage_unlocked`) se disparan en sus puntos correctos, verificados con `fetch` mock que afirma shape del body.
- **R9:** Validación visual Pencil ≥95% sobre los frames declarados (`y7l3U`, `u0zya`, `n9qKI`, `TkgaG`, `J6Q0y`, `XpxPI`, `wLtji`, `Fq5pk`, `u0Ss4`, `F66Mc`, `uJB82`, `HUAGw`, `zKjTc`) en light + dark.
- **R10:** A11y mínimo: `UploadDraftDialog` atrapa foco, ESC cierra; file input tiene `aria-label`; progress bar tiene `role="progressbar"` con `aria-valuenow`; `ApproveDraftButton` tiene estado disabled accesible cuando no es current version.

## Early proof point

Task `fn-7-feat-007-draft-submit-review-approve.2` (`InlineVideoPlayer` + Upload\* components + `useDraftUploadFlow`) valida el core técnico de la feature: que el two-phase upload con XHR funciona end-to-end contra el backend dev (intent firma OK, PUT a S3 reporta progress, complete crea el draft). Si esa task falla — por ejemplo si el `Content-Type` firmado se rompe en cross-origin o el progress no fluye — hay que re-evaluar el approach (¿proxy del backend? ¿`fetch` con stream Reader API? ¿librería tipo `axios-progress`?) **antes** de seguir con F.3+ que dependen del flujo funcionando.

## Requirement coverage

| Req | Description                                                 | Task(s)                                                    | Gap justification |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------- | ----------------- |
| R1  | Orval regen + types + hooks generados                       | fn-7-...-approve.1                                         | —                 |
| R2  | Two-phase upload con progreso, cancel y errores tipados     | fn-7-...-approve.2                                         | —                 |
| R3  | DraftSubmitted/ApprovedCard conectadas + ApproveDraftButton | fn-7-...-approve.3                                         | —                 |
| R4  | DeliverableListPanel single/bundle/multistage               | fn-7-...-approve.4                                         | —                 |
| R5  | WS handlers + invalidaciones                                | fn-7-...-approve.5                                         | —                 |
| R6  | Multistage stage unlock vía WS                              | fn-7-...-approve.4, fn-7-...-approve.5                     | —                 |
| R7  | Approve button disabled con copy "newer version"            | fn-7-...-approve.3                                         | —                 |
| R8  | Analytics events client-side                                | fn-7-...-approve.6                                         | —                 |
| R9  | Validación visual Pencil ≥95%                               | fn-7-...-approve.2, fn-7-...-approve.3, fn-7-...-approve.4 | —                 |
| R10 | A11y mínima en upload + approve                             | fn-7-...-approve.2, fn-7-...-approve.3                     | —                 |

## References

- Spec técnica: `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §7 (frontend), §4 (contrato), §5 (eventos), §10 (analytics).
- Spec producto: `marz-docs/features/FEAT-007-draft-submit-review/02-spec.md`.
- Glossary: `marz-docs/glossary.md` (Deliverable, Draft, Stage).
- Frames Pencil: `marzv2.pen` — `y7l3U`, `u0zya`, `n9qKI`, `TkgaG`, `J6Q0y`, `XpxPI`, `wLtji`, `Fq5pk`, `u0Ss4`, `F66Mc`, `uJB82`, `HUAGw`, `zKjTc`, `zcddo`, `mr5U9`.
- Cross-epic: depende de FEAT-003 (Workspace shell + WS hook), FEAT-004 (Timeline + system_event branching), FEAT-006 (Stage transitions in multistage).

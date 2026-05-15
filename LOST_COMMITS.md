# Commits huérfanos (unreachable)

Snapshot generado durante sesión de observabilidad del 2026-05-14.

Estos commits existen en el repo local (`git fsck --unreachable` los lista) pero **ningún branch los referencia**. Quedaron flotando después de un `git stash drop` (o equivalente) en el flujo rafita.

Recomendación al usar esta lista: cuando aparezca un bug o un cambio "que ya habíamos hecho", buscá acá primero el archivo y revisá si el fix vivía en uno de estos commits antes de reimplementar.

Para ver el contenido de un commit:
```bash
git show <sha>                                  # diff completo
git show --stat <sha>                           # solo lista de archivos
git show <sha> -- <path>                        # diff de un archivo puntual
git checkout <sha> -- <path>                    # recuperar un archivo
```

---

## Aplicados al working tree el 2026-05-14

> Estos ya están en `git status` como modificados/agregados. Falta committearlos.

- **✅ `211b4b1`** — `WIP on dev` (`2026-05-10 19:13`) — **APLICADO PARCIALMENTE**
  - **Recuperado**: prop `required?: boolean` en 6 fields (`FieldRow`, `TextField`, `NumberField`, `SelectField`, `SwitchField`, `TextareaField`) + `*` rojo al lado del label.
  - **Recuperado manualmente**: `required` agregado en P3Review para Nombre, Objetivo, Presupuesto.
  - **Recuperado manualmente en `P1Input.tsx`**: quitar `WizardSectionTitle`, renombrar labels ("URL de la campaña", "Descripción del brief"), quitar botón "Usar el de la marca", agregar `required` al URL, agregar separador "o adjuntá un PDF en lugar de la descripción", reformular mensaje final.
  - **NO recuperable sin PR completo aparte** (rompe contrato porque otros archivos en HEAD no soportan los campos nuevos):
    - `BriefDraft` extendido con `tone` / `key_messages` / `do_list` / `dont_list` (4 campos nuevos del back).
    - `briefHasGaps` con lógica OR (warning si falta cualquier campo) en lugar de AND (warning solo si todo vacío).
    - `P1Input.tsx`: auto-prepend `https://` en blur, labels renombrados ("Sitio web del producto" → "URL de la campaña", "Descripción del producto o servicio" → "Descripción del brief"), quitar botón "Usar el de la marca", separador visual "o adjuntá un PDF".
    - Schema `createPhase3Schema` (factory en lugar de const) + `formInputSchema` con websiteUrl required + hard_filters con `field/operator/value` en lugar de `filter_type/filter_value`.
    - `pdfS3Key` en store.
    - Componentes (`BriefProcessingStep`, `BriefSummaryView`, `HardFilterForm`, `PDFUploadField`, `ScoringDimensionCard`, `WeightSumIndicator`) actualizados al contrato nuevo.
    - Banner `InsufficientBanner` ("Algunos campos no se pudieron generar automáticamente. Completalos a mano antes de continuar.") en lugar de `InsufficientFieldHint` por campo.
    - Status `partial` propagado al state machine de P2Progress steps.
  - **Razón del bloqueo**: el contrato `BriefDraft` evolucionó después del 2026-05-10. `useCampaignBrief.ts`, `BriefProcessingStep.tsx`, `P2Progress.test.tsx` y otros archivos en HEAD NO soportan `tone`/`key_messages`/`do_list`/`dont_list`. Traer el commit en bloque genera ~15 errores de typecheck que requieren cambios coordinados en código no incluido en el commit (back contract + tipos generados Orval).
  - **Síntoma para reabrir**: si querés que el front muestre tono/mensajes clave/do-don't lists del brief generado por AI, o querés el warning más estricto, hay que hacer un PR coordinado back+front (el back ya envía los campos, el front los descarta).
  - `git show 211b4b1`

- **✅ `7f000fc`** — `WIP on dev: fn-18 (#16)` (`2026-05-10 19:21`) — **APLICADO PARCIALMENTE**
  - **Bonus de la feat-019 (configuration wizard) + e2e + Faro identity**.
  - **Recuperados al working tree**:
    - `src/features/campaigns/brief-builder/hooks/useBriefProcessingState.ts` (hook GET `/brief-processing-state`).
    - `src/shared/observability/useFaroIdentity.ts` (asocia sesión Clerk al user en Faro).
    - + se agregó `setFaroUser`/`clearFaroUser` a `faro.ts` para que `useFaroIdentity` compile.
  - **No recuperados (ya existen en dev, evolucionaron por otro path)**:
    - `openapi/CHANGELOG.md`, `scripts/openapi-changelog.ts`, `scripts/lib/openapi-diff.ts`
    - `src/components/ui/toggle-group.tsx`, `toggle.tsx`, `BonusAmountField.tsx`
    - `useCreateCampaign.test.ts`, `useCampaignBrief.test.ts`
    - Rutas `_brand/campaigns.$campaignId.index.tsx`, `_creator/discover.campaigns.tsx`
    - `src/shared/observability/faro.ts` (la versión actual es más completa con `propagateTraceHeaderCorsUrls`).
    - 5 specs E2E de `feat019/` (todos presentes).
  - `git show 7f000fc`

- **⚠️ `df11642`** — `index on dev: 9847772 bonus` (`2026-05-10 20:02`) — **NO APLICADO (intencional)**
  - Lo crítico (`useBriefBuilderWS.ts` + `P2Progress.tsx`) ya fue reimplementado el 2026-05-14 con fixes adicionales (retry de StrictMode con `subscribeAttempt`, swallow `not_connected`, `router.navigate` en complete). **Traer el commit perdería esos fixes.**
  - Resto del commit (refactor offers hooks, `AppTopbar`, `B1IdentityScreen`, `useCampaignsList`) está sin tocar por ser riesgoso sin testing. Disponible si después aparece algún síntoma:
    - `useCreateBundleOffer`, `useCreateMultistageOffer`, `useCreateSingleOffer` simplificados de ~38 a ~10 líneas.
    - `useCampaignsList` simplificado (-123/+56 líneas).
    - `AppTopbar.tsx` rewrite (-117/+30).
    - `B1IdentityScreen.tsx` onboarding brand rewrite.
  - 65 archivos.
  - `git show df11642`

---

## Pendientes — para revisar cuando aparezca el síntoma correspondiente

### `2b8bece` — `index on dev: 3a57ad2 wp` (`2026-05-11 21:07`)

- **Fix del prefix de event_type en WS**: cambia `brief.processing.*` → `campaigns.brief.processing.*` (el back pasó a usar ese prefix). Mismo fix en `campaigns.configuration.*` (`useConfigurationWebSocket.ts`) y `useCampaignTopicSubscription.ts`.
- Refactor `ChatHeaderActions` → split en `ConversationContextHeader` (nuevo) + `ConversationHeader` reorganizado.
- `OfferCardReceived/Sent` reemplazados por `CurrentOfferBlock` rediseñado.
- `OfferDeliverablesList.tsx`: refactor.
- `ws/types.ts`, `ws/handlers.ts`: tipos reorganizados.
- `OfferArchiveItem`, `OffersArchiveBlock`, `BundleEditor`, `MultiStageEditor`: cambios.
- 41 archivos.
- **Síntoma**: el front no recibe eventos WS de un dominio (brief / configuration / campaign topic). Verificá que el event_type tenga el prefix `campaigns.`.
- `git show 2b8bece`

### `710632` — `index on dev: 98aa7cb wp` (`2026-05-11 18:15`)

- **UI shell + navigation**.
- `CampaignDetailHeader.tsx`: modificaciones.
- `AppSidebar.tsx` + `navigation.ts`: refactor de navegación (item nuevo, reorden, o active state).
- `__root.tsx`: modificación del root layout.
- `useMarkConversationReadMutation.ts`: cambios.
- `CurrentOfferBlock.tsx` + test: UI de oferta actual en chat.
- `MultiStageStagesList.tsx` + test: nuevos o reescritos.
- `MultistagePanelGroup.tsx`, `DeliverableListPanel.tsx`: cambios.
- `useCanSendOffer.ts`: hook nuevo o cambio.
- 20 archivos.
- **Síntoma**: layout/sidebar/topbar con bug visual, o mutación `markConversationRead` rara.
- `git show 710632`

### `d00868f` — `index on dev: bdfff07 wp` (`2026-05-11 23:18`)

- **Chat UI + offers formatting**.
- `DaySeparator.tsx`, `MessageTimeline.tsx`, `groupByDay.ts`, `eventBubbleMeta.ts`: cómo se agrupan/renderizan mensajes del chat (por día, system events).
- `OfferCardReceived/Sent.tsx`, `OfferDeliverablesList.tsx`, `OfferTimelineEntry.tsx`: presentación de offers en chat.
- `formatOffer.ts`, `offers/schemas.ts`: cambios de schema/formato.
- `ApplicationCard.tsx` (discovery): cambios.
- Spec e2e `feat007/offer-sent-render.spec.ts` + `fixtures.ts`.
- 17 archivos.
- **Síntoma**: chat se ve raro, agrupación por día, system event cards de offers/links con visual incorrecto.
- `git show d00868f`

### `1002b8` — `index on dev: 134ce37 wp` (`2026-05-12 15:56`)

- **UploadDraftDialog + UI offers/deliverables**.
- `UploadDraftDialog.tsx` + `useDraftUploadFlow.ts`: flow de subida de drafts.
- `DraftSubmittedCard.tsx`, `DraftApprovedCard.tsx`, `RequestChangesCard.tsx`, `LinkSubmittedCard.tsx`, `ExpectedDeliverableSlot.tsx`, `DeliverableStatusBadge.tsx`: system event cards del chat.
- `OfferCardReceived/Sent`, `OfferAcceptedCardIn/Out`, `NextStep.tsx`, `CurrentOfferBlock.tsx`: más refactor de UI.
- `ConversationView.tsx`, `MessageTimeline.tsx`, `eventBubbleMeta.ts`: chat UI nuevamente.
- 26 archivos.
- **Síntoma**: subida de draft con UX rara, system event cards visualmente desactualizadas.
- `git show 1002b8`

### `758faa6` — `WIP on dev: a4e4ea2 wp` (`2026-05-13 00:05`)

- **Idempotency genérica + cleanup masivo**.
- Crea `src/shared/api/idempotency.ts` (nuevo, 49 líneas).
- `mutator.ts`: modifica el cliente para soportar idempotency keys centralizadas.
- Refactor masivo de hooks de mutaciones para usar la idempotency genérica: `useCreateCampaign`, `useApproveLink`, `useRequestLinkChanges`, `useSubmitLink`, `useRequestChangesFlow`, `useSubmitCampaignApplicationMutation`, `useSendMessageMutation`, `useCreateCampaignInvite`, `inbox/api/inbox.ts`, `discovery/campaign-detail/mutations.ts`, `deliverables/api/*`.
- Borra `discovery/campaign-board/utils/idempotencyKey.ts` (queda deduplicado en el genérico).
- `scripts/seed-conversation.ts`: cambios (probablemente `--remote-debugging-port=9222` y otros tweaks).
- `BonusStep.tsx`, `configuration/hooks.ts`: refactor.
- `LinkSubmittedCard`, `RequestChangesModal`, `SubmitLinkSidesheet`, `UploadDraftDialog`: cambios de UI.
- `P4Confirm.tsx`, `useCreateCampaign.ts`: cambios.
- 65 archivos.
- **Síntoma**: duplicación de requests POST (sin idempotency key), o cada hook de mutación reimplementa idempotency a mano.
- `git show 758faa6`

### `84117ba` — `WIP on dev: 18de48b wp` (`2026-05-13 21:50`)

- **El más grande pendiente** — 139 archivos modificados.
- Sin inspeccionar al detalle todavía. Probablemente acumula varios fixes seguidos.
- `git show --stat 84117ba | head -150`

---

## Otros unreachable (probablemente seguros de ignorar)

Estos son `index on epic-close` (snapshots automáticos justo antes de cerrar un epic) o stashes muy viejos de abril. **Probablemente sus cambios ya fueron mergeados como parte del epic correspondiente.** Listo solo para referencia rápida.

### Epic-close snapshots (probablemente ya aplicados como parte del merge del epic)

- `228d207` (`2026-05-09 16:51`, 397 archivos) — index on `fn-18-campaign-configuration-wizard-feat-019` close epic round 1.
- `1d0bf37a` (`2026-05-09 16:22`, 318 archivos) — index on `fn-16-feat-017-creator-campaign-board-frontend` close epic.
- `5b096c4` (`2026-05-09 16:43`, 270 archivos) — index on `fn-17-feat-018-brand-payments-spending` close epic.
- `cf02c3d4` (`2026-05-09 16:14`, 263 archivos) — index on `fn-15-feat-016-creator-earnings-frontend` close epic.
- `8a10cdf` (`2026-05-02 15:08`, 141 archivos) — index on dev Workspace.

### WIP intermedios

- `9385178f` (`2026-05-09 13:19`) — WIP on `fn-18-campaign-configuration-wizard-feat-019` "Campaigns list pending badge" (9 archivos).
- `1c8c77a5` (`2026-05-09 21:43`) — WIP on dev fn-18 (21 archivos).
- `37110b9` (`2026-05-09 21:37`) — WIP on dev fn-18 (21 archivos).
- `3f8c2bed` (`2026-05-08 13:21`) — WIP on dev "rafita" (8 archivos).
- `72001f5e` (`2026-05-09 08:08`) — WIP en rafita-tmp-base.
- `a6806397` (`2026-05-04 18:27`, 22 archivos) — index on dev "test e2e conversation".
- `928360a` (`2026-05-04 18:44`, 25 archivos) — index on dev "test e2e conversation".

### Antiguos (abril)

- `f30cc1e` (`2026-04-27 20:34`, 76 archivos) — index on dev epic 2.
- `5511e96` (`2026-04-27 11:03`) — index on main.
- `770ae46` (`2026-04-25 09:00`) — "rafita".
- `0309bae` (`2026-04-25 11:45`) — "reviewer colgado".
- `b006a90` (`2026-04-20 23:32`) — feat(fn-1.10) F.7.
- `4a92b3c` (`2026-04-20 23:32`) — feat(fn-1.11) F.8.
- `a78e92d` (`2026-04-20 23:33`) — feat(fn-1.13) F.10.
- `2e8387b` (`2026-04-20 23:31`) — feat(fn-1.4) F.2.
- `05007413` (`2026-04-20 23:34`) — feat(fn-1.20) F.17.
- `0a85f9b` (`2026-04-20 23:35`) — chore(fn-1) close epic.

---

## Cómo regenerar esta lista

```bash
cd marz-front
git fsck --unreachable --no-reflogs 2>&1 | grep "unreachable commit" | awk '{print $3}' | while read sha; do
  msg=$(git log -1 --format='%ai %s' "$sha" 2>/dev/null)
  count=$(git show --stat "$sha" 2>/dev/null | tail -1 | grep -oE "[0-9]+ files?" | head -1)
  echo "$sha | $msg | $count"
done
```

Si Git hace GC (`git gc` o automático), estos commits pueden desaparecer permanentemente. Para preservarlos sin tener que aplicar nada, podés crear refs:

```bash
git update-ref refs/recovered/211b4b1-required-fields 211b4b1dd7441ad8555ca0883ad68272a6c64915
git update-ref refs/recovered/df11642-bonus-brief-builder df11642ccedf3899b762b2d9c87e237dc190c436
# etc
```

Con eso quedan "vivos" hasta que vos los borres explícitamente.

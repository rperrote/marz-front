---
satisfies: [R9]
---

## Description

Eliminar antipatterns de state & effects: `no-prop-callback-in-effect` ×6, `no-derived-state-effect` ×5, `no-derived-useState` ×5, `no-cascading-set-state` ×5, `no-effect-event-handler` ×2, `rerender-state-only-in-handlers` ×1. Cada uno requiere refactor caso-por-caso siguiendo "You Might Not Need an Effect".

**Size:** M
**Files:**
- `no-prop-callback-in-effect`: `src/features/deliverables/components/UploadDraftDialog.tsx:56`, `src/features/offers/components/BundleEditor.tsx:141`, `src/features/discovery/campaign-board/CampaignBoardFilters.tsx:58`, `src/features/campaigns/detail/CampaignCreatorsTable.tsx:132`, `src/features/offers/components/MultiStageEditor.tsx:104`, `src/features/offers/components/SingleEditor.tsx:156`
- `no-derived-state-effect`: `src/features/earnings/components/EarningsSearchExportBar.tsx:40`, `src/features/deliverables/components/SubmitLinkSidesheet.tsx:94`, `src/features/identity/app-shell/AppTopbar.test.tsx:14`, `src/features/chat/workspace/ConversationSearchInput.tsx:26`, `src/features/offers/components/SendOfferSidesheet.tsx:54`
- `no-derived-useState`: `src/features/earnings/components/PendingBonusPanel.tsx:33,34`, `src/shared/i18n/provider.tsx:43`, **EXCLUIR** `src/features/campaigns/configuration/ContentTypeStep.tsx:49` y `PricingModelStep.tsx:61` (fn-18)
- `no-cascading-set-state`: `src/features/identity/onboarding/brand/screens/B12LoadingScreen.tsx:62`, `src/features/earnings/components/PendingBonusPanel.tsx:44,52`, `src/features/campaigns/brief-builder/hooks/useBriefBuilderWS.ts:154`, `src/shared/ws/useWebSocket.ts:56`
- `no-effect-event-handler`: `src/features/deliverables/components/UploadDraftDialog.tsx:47`, `src/features/offers/components/SendOfferSidesheet.tsx:48`
- `rerender-state-only-in-handlers`: `src/features/offers/components/SendOfferSidesheet.tsx:43`

## Approach

- **prop-callback-in-effect**: lift state al padre (controlled component) o mover el callback dentro de un event handler real. Patrón: el padre pasa `value` + `onChange`, el hijo no mantiene state interno que sincronice vía effect.
- **derived-state-effect / derived-useState**: computar inline durante render (`const x = transform(prop)`). Si necesitás reset state al cambiar prop, usar `<Component key={prop.id} />` en lugar de `useEffect(() => setX(initial), [prop])`.
- **cascading-setState**: combinar múltiples `setState` en `useReducer` o en una sola pieza de state. En `useBriefBuilderWS.ts` y `useWebSocket.ts`, evaluar si el state debe migrar a `useReducer` (varios reducers ya son útiles para máquinas WS).
- **effect-event-handler**: mover la lógica del effect al onClick/onChange real. Pattern típico: `useEffect(() => { if (open && data) doX() }, [open, data])` → llamar `doX()` en el handler que setea `open`.
- **rerender-state-only-in-handlers**: si `editorDirty` solo se setea y se lee en handlers (nunca en JSX), reemplazar `useState` con `useRef`. `ref.current = ...` no causa re-render.

## Investigation targets

**Required**:
- `src/features/inbox/hooks/useMarkInboxItemReadMutation.ts:11-27` (patrón canónico mutation+invalidate)
- `src/features/offers/components/SendOfferSidesheet.tsx:30-100` (3 issues en este archivo — tratarlos juntos)
- `src/features/earnings/components/PendingBonusPanel.tsx:20-80` (3 issues)
- `src/features/deliverables/components/UploadDraftDialog.tsx:30-80` (2 issues)
- https://react.dev/learn/you-might-not-need-an-effect

**Optional**:
- React 19 useReducer reference

## Acceptance

- [ ] `react-doctor` reporta 0 en: `no-prop-callback-in-effect`, `no-derived-state-effect`, `no-derived-useState` (excluyendo configuration), `no-cascading-set-state`, `no-effect-event-handler`, `rerender-state-only-in-handlers`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] No regresión funcional en sidesheets/dialogs/wizards afectados — verificar manualmente upload draft, send offer, bundle editor, multistage editor, campaign creators table.
- [ ] Tasks de configuration wizard fn-18 explícitamente NO tocadas — los 2 issues en `ContentTypeStep.tsx` y `PricingModelStep.tsx` quedan diferidos.

## Done summary
draft eliminado del estado interno y API pública de useDraftUploadFlow; tests actualizados correctamente
## Evidence
- Commits:
- Tests:
- PRs:
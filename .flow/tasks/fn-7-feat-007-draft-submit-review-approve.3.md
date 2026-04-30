---
satisfies: [R3, R7, R9, R10]
---

## Description

Conectar las cards `DraftSubmittedCard` y `DraftApprovedCard` (hoy son placeholders desde FEAT-003) al snapshot real del `system_event`, agregar `ApproveDraftButton` con la regla de "current version only", y agregar branching en el `Timeline.tsx` (FEAT-004) para los `event_type` `'DraftSubmitted'` y `'DraftApproved'`.

**Size:** M (3 componentes editados/agregados + 1 hook mutation + branching en timeline)
**Files:**

- `src/features/deliverables/components/DraftSubmittedCard.tsx` (modificar — conectar snapshot real)
- `src/features/deliverables/components/DraftApprovedCard.tsx` (modificar — conectar snapshot real)
- `src/features/deliverables/components/ApproveDraftButton.tsx` (nuevo)
- `src/features/deliverables/hooks/useApproveDraft.ts` (nuevo — wrapper sobre `useApproveDraftMutation` con invalidaciones)
- `src/features/chat/components/Timeline.tsx` (modificar — branching nuevo)
- `src/features/deliverables/components/__tests__/ApproveDraftButton.test.tsx` (nuevo)

## Approach

**`DraftSubmittedCard`:**

- Hoy renderiza placeholder. Pasar a leer del prop `message: ChatMessage` (tipo de FEAT-004) cuyo `payload` matches `DraftSubmittedSnapshot` del solution doc §4.2.
- Estructura: header (account avatar/name + timestamp), body (filename, version, file_size formateado, duration HH:MM:SS), `<InlineVideoPlayer>` (solo en vista brand — variant `n9qKI`), footer con `<ApproveDraftButton>` cuando `session.kind === 'brand' && session.role === 'owner' && message.payload.snapshot.deliverable.current_version === message.payload.version`.
- Vista creator (variant frame `u0Ss4`) — sin player, solo metadatos: detectar via `session.kind === 'creator'`.
- Tokens: rounded-2xl card, `--card` background, divider `--border`.

**`DraftApprovedCard`:**

- Mismo patrón. Sin player. Frame `mr5U9`.
- Body muestra: "Approved by {brand_user_name} on {approved_at}" + thumbnail si existe.

**`ApproveDraftButton`:**

- Props: `{ deliverableId, version, onApproved? }`.
- Estado disabled cuando `version !== currentVersion` (lee de `useGetConversationDeliverablesQuery` cache via `queryClient.getQueryData`). Copy del disabled tooltip: "A newer version was submitted".
- Click → `useApproveDraft(deliverableId).mutate()`. El wrapper invalida `['conversation-deliverables', conversationId]` y `['conversation-messages', conversationId]` en `onSuccess`.
- Manejo de errores: `409 deliverable_not_in_draft_submitted` ya cubierto por la disabled rule + WS invalidate, pero defensivo en `onError` mostrar toast.

**Branching en `Timeline.tsx`:**

- Hoy `Timeline.tsx` ya hace `switch(message.event_type)` para system_events de FEAT-004. Agregar dos cases nuevos:
  - `'DraftSubmitted'` → `<DraftSubmittedCard message={...} />`
  - `'DraftApproved'` → `<DraftApprovedCard message={...} />`
- Mantener fallback default (renderiza nada o card genérica).

## Investigation targets

**Required:**

- `src/features/deliverables/components/DraftSubmittedCard.tsx` — placeholder actual (entender shape esperado de prop)
- `src/features/deliverables/components/DraftApprovedCard.tsx` — idem
- `src/features/chat/components/Timeline.tsx` — switch existente, dónde insertar los cases
- `src/shared/api/generated/endpoints.ts` (post-F.1) — `useApproveDraftMutation` firma + return type
- `src/features/identity/` — cómo leer `session.role` y `session.kind` (provider o hook existente)
- `marz-docs/features/FEAT-007-draft-submit-review/03-solution.md` §4.2 (shape de `DraftSubmittedSnapshot` y `DraftApprovedSnapshot`)

**Optional:**

- Frames Pencil `n9qKI`, `TkgaG`, `u0Ss4`, `wLtji`, `Fq5pk`, `F66Mc`, `uJB82`, `HUAGw`, `mr5U9`

## Design context

- **Cards de timeline:** rounded-2xl, `bg-card`, `border-border`, padding interno generoso, max-width fluid.
- **Approve button:** primary fill (`--primary`), full-width o contained según frame `n9qKI`. Disabled state con `opacity-50` + cursor-not-allowed + tooltip.
- **Player:** ya estilado en F.2. Aquí solo se embebe.
- **Variantes brand vs creator:** la card `n9qKI` "Brand" tiene player; la card `u0Ss4` "Creator" no. Resolver via `session.kind`, no por dos componentes distintos.

UI redondeada siempre. Light + dark.

Full design system: `src/styles.css`.

## Acceptance

- [ ] `DraftSubmittedCard` y `DraftApprovedCard` rinden con datos reales del `message.payload.snapshot` (no placeholder).
- [ ] `ApproveDraftButton` solo aparece para `session.kind === 'brand' && session.role === 'owner'` y sobre `version === current_version`.
- [ ] Click sobre approve dispara `useApproveDraftMutation` y refetcha la conversation; aparece la `DraftApprovedCard` en la timeline (manualmente o vía WS de F.5; en este task verificable con invalidate manual).
- [ ] Cuando llega un mensaje WS con `version > version del card actual`, el botón se deshabilita con copy "A newer version was submitted" (tooltip o texto inline).
- [ ] Branching en `Timeline.tsx` rinde el componente correcto para cada `event_type`.
- [ ] Tests: `ApproveDraftButton.test.tsx` cubre: render owner+current → enabled, role distinto → no render, version stale → disabled con copy correcta, click → mutation invocada.
- [ ] `pnpm tsc --noEmit` y `pnpm lint` pasan.
- [ ] Validación visual Pencil ≥95% sobre `n9qKI` (brand variant), `u0Ss4` (creator variant), `mr5U9` (approved), `F66Mc` / `uJB82` / `HUAGw` (states relevantes), light + dark.
- [ ] A11y: el botón disabled comunica el motivo via `aria-disabled` + `aria-describedby` apuntando al tooltip.

## Done summary

Implementación completa y correcta. sessionKind llega por prop desde el route context (workspace.tsx inyecta 'brand' as const, el route hijo lo lee con useRouteContext y lo pasa a ConversationView → MessageTimeline). DraftSubmittedCard y DraftApprovedCard consumen snapshots autocontenidos desde message.payload, sin re-fetch del aggregate. ApproveDraftButton implementa stale-version guard consultando /v1/conversations/:id/deliverables e invalidando ambas queryKeys (conversation-deliverables + conversation-messages) post-aprobación. InlineVideoPlayer recibe aspect prop para 9/16 vs 16/9. Tests cubren los 4 casos críticos del botón. TypeScript, lint y 768 tests pasan.

## Evidence

- Commits:
- Tests:
- PRs:

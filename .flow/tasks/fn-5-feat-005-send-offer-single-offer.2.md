---
satisfies: [R1, R6, R8]
---

## Description

Construir el `SendOfferSidesheet`: sidesheet montado sobre la `Conversation` activa que permite a un `brand owner` enviar una oferta tipo `single`. Form con TanStack Form + Zod (schema generado por Orval), validaciones inline (bloqueantes) y warning no-bloqueante por exceso de budget. Selector de campaign activa (filtra por `status='active'` + workspace del usuario). Currency display-only derivada de la campaign.

Al éxito (201): cerrar sidesheet + toast + dejar que el WS event traiga la card a la timeline. **No** insertar manualmente la card optimista — la `OfferCardSent` viene por WS (single source of truth, igual que system_events del chat existente).

**Size:** M
**Files:**

- `src/features/offers/components/SendOfferSidesheet.tsx` (nuevo)
- `src/features/offers/components/SpeedBonusFields.tsx` (nuevo, sub-form colapsable)
- `src/features/offers/components/DeliverableSummaryRow.tsx` (nuevo, Pencil `XVVnm`)
- `src/features/offers/store/sendOfferSheetStore.ts` (nuevo, Zustand: `isOpen`, `conversationId`, `open`, `close`)
- `src/features/offers/hooks/useActiveCampaigns.ts` (nuevo wrapper sobre Orval `useListCampaigns({status:'active'})` filtrando por workspace activo)

## Approach

- TanStack Form con `validators.onSubmit = createSingleOfferRequestSchema` (Zod generado). Refinements adicionales para campos cruzados (`early_deadline < deadline`, `bonus_amount > 0` cuando `speed_bonus` activo).
- Selector de campaign: combobox simple basado en `useActiveCampaigns()`. Al elegir, fija `currency` display-only y guarda `campaign.budget_remaining` para el warning.
- Warning de budget: render condicional cuando `parseFloat(amount) > campaign.budget_remaining`. Texto neutro, NO `aria-invalid` (es advertencia, no error).
- Mutation: `useCreateSingleOffer()`. `onSuccess` → cerrar sheet, mostrar toast neutro "Offer sent". Errores tipados del backend (§4.1.1) se mapean a mensajes de form: `validation_error.field` apunta al field, `campaign_not_active` muestra banner top.
- Pencil reference: `Sidesheet/SendOffer` (`t9oYN`). Estados Pencil: `EH5a4` (light), `Kgknb` (dark).
- Store Zustand: solo UI state, sin persistencia. Triggered desde `ConversationHeaderActions` (F.6).
- A11y: focus trap (radix `<Dialog>` o equivalente shadcn), ESC cierra (con confirm si form dirty? — spec dice "se pierde lo cargado", NO confirmar), todos los inputs con `<Label>` asociado, errores con `aria-live="polite"`.

## Investigation targets

**Required**:

- `marz-front/CLAUDE.md` §Forms (TanStack Form + Zod, no react-hook-form)
- `src/components/ui/sheet.tsx` (primitive shadcn ya disponible) — pattern para focus trap
- `src/shared/api/generated/zod/createSingleOfferRequestSchema.ts` (post F.1)
- `src/features/campaigns/hooks/useListCampaigns.ts` (asumir nombre, buscar real con grep) — para `useActiveCampaigns`
- `../marz-docs/features/FEAT-005-offer-single/02-spec.md` §Edge cases (cancela a mitad, budget excedido, no campaigns)
- `../marz-docs/features/FEAT-005-offer-single/03-solution.md` §4.1.1 (errores tipados) y §7.6 F.2

**Optional**:

- `src/features/auth/store/authStore.ts` — para leer `currentAccount.kind` y `membership.role`

## Design context

DESIGN.md no existe en este repo. Tokens y referencias visuales viven en `marz-design/marzv2.pen` (acceso vía MCP `pencil`):

- **Componente raíz**: `Sidesheet/SendOffer` (nodeId `t9oYN`)
- **Mockups de pantalla**: `EH5a4` (light), `Kgknb` (dark)
- **Sub-componente**: `SummaryTotalRow` (`XVVnm`)
- **Tokens**: usar variables CSS (`bg-background`, `text-foreground`, `rounded-lg`) — nunca hardcodear colores/radios. Geist self-hosted.

## Key context

- **No optimistic insert** del message. La card viene por WS event `chat.message.created` con `event_type='OfferSent'`. Si en testing local el WS está enabled:false, dejar pendiente la verificación visual (F.5 termina de wirear el WS).
- TanStack Form en este repo se usa con `useForm({ validators: { onChange, onSubmit } })` — chequear pattern existente en otra feature antes de inventar.

## Acceptance

- [ ] Brand owner abre el sidesheet desde el botón (placeholder dispatcher hasta F.6) y completa el form sin errores cuando los datos son válidos.
- [ ] Validaciones bloqueantes: deadline ≤ today, amount ≤ 0, early_deadline ≥ deadline, bonus_amount ≤ 0 — el submit queda disabled o muestra error inline antes de pegar al backend.
- [ ] Warning no-bloqueante visible cuando `amount > campaign.budget_remaining`, sin impedir submit.
- [ ] Selector de campaigns muestra solo `status='active'` del workspace activo. Si no hay ninguna, el sidesheet renderiza un empty state explicando el motivo (defensive — el botón en F.6 ya bloquea apertura, esto cubre apertura por deep link futuro).
- [ ] Currency display-only matchea `campaign.budget_currency`. No es input.
- [ ] Mutation `useCreateSingleOffer` envía request con shape exacta del Zod schema; al 201 cierra sidesheet + toast.
- [ ] Errores del backend mapean a UI: `validation_error` → field error (`details.field`), `campaign_not_active` → banner, otros → toast genérico.
- [ ] Cerrar a mitad descarta el form (no localStorage).
- [ ] Unit tests: `formValidation` (4 casos bloqueantes), `budgetWarning` (no bloquea), `disabledWhenNoCampaigns` (empty state), `mapsBackendErrors`.
- [ ] Validación visual Pencil ≥95% contra `EH5a4` (light) y `Kgknb` (dark) — light + dark.
- [ ] A11y: focus trap operativo, ESC cierra, todos los inputs con label, errores con `aria-live`. Verificado con `vitest-axe` o equivalente del repo.

## Done summary

Fix correcto. El branch campaignsQuery.isError ahora se evalúa antes que el check de empty state (!hasCampaigns && !isLoading), eliminando el falso negativo donde un error de red mostraba el mensaje de 'no campaigns'. El mensaje de error usa text-destructive, el botón Retry llama refetch() con void para suprimir la promesa flotante, y el orden de precedencia (isError → empty → form) es el correcto.

## Evidence

- Commits:
- Tests:
- PRs:

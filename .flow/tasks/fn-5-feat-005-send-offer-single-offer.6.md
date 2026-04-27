---
satisfies: [R1, R5]
---

## Description

Agregar el botón "Send Offer" al `ConversationHeaderActions` con gating: visible solo si `currentAccount.kind === 'brand'` y `membership.role === 'owner'` para el workspace de la conversation. Disabled (con tooltip "No active campaigns") cuando no hay campaign con `status='active'`. El click abre el `SendOfferSidesheet` vía el store Zustand de F.2.

**Size:** S
**Files:**

- `src/features/conversations/components/ConversationHeaderActions.tsx` (modificación)
- (eventualmente) `src/features/offers/hooks/useCanSendOffer.ts` (nuevo: encapsula gating logic)

## Approach

- Hook `useCanSendOffer({ conversationId })`:
  - Lee `currentAccount` del auth store.
  - Si `kind !== 'brand'` → `{ visible: false }`.
  - Lee `membership.role` para el workspace de la conversation. Si `!== 'owner'` → `{ visible: false }`.
  - Lee `useActiveCampaigns()` (creado en F.2). Si `count === 0` → `{ visible: true, disabled: true, reason: 'no-active-campaigns' }`.
  - Else → `{ visible: true, disabled: false }`.
- En `ConversationHeaderActions`, render condicional con tooltip de shadcn cuando disabled.
- Click handler: `sendOfferSheetStore.open(conversationId)`.
- A11y: `<button>` real, `aria-disabled` cuando aplica, tooltip accesible (radix).

## Investigation targets

**Required**:

- `src/features/conversations/components/ConversationHeaderActions.tsx` (verificar nombre real con grep)
- `src/components/ui/tooltip.tsx` (shadcn primitive)
- `src/features/offers/store/sendOfferSheetStore.ts` (creado en F.2)
- `src/features/offers/hooks/useActiveCampaigns.ts` (creado en F.2)
- `src/features/auth/store/authStore.ts` (verificar exposición de `currentAccount` y `membership`)

**Optional**:

- `../marz-docs/features/FEAT-005-offer-single/02-spec.md` §Permisos — gating semántico

## Design context

Tokens: botón primary (`var(--primary)`), `rounded-md`. Posición en el header derecho (final del action group). Pencil reference en pantalla `mRJ63` (timeline brand) — ubicación visual del botón.

## Acceptance

- [ ] Botón visible para brand owner en workspace con ≥1 campaign activa, abre el sidesheet al click.
- [ ] Botón visible pero disabled con tooltip "No active campaigns" cuando no hay campaigns activas.
- [ ] Botón **no se renderiza** para creators ni para brand admins/members.
- [ ] Unit tests: `shows for brand owner only`, `disabled with tooltip when no active campaigns`, `hidden for non-owner roles`, `hidden for creators`.
- [ ] A11y: tooltip accesible (radix), botón con `aria-disabled` cuando aplica, click área ≥44px.
- [ ] E2E del flujo completo "send-receive-accept" cubre la aparición del botón (cubierto en F.3).

## Done summary
Cambio correcto y minimal. reason?: 'no-active-campaigns' convierte el campo en literal discriminante — el compilador ahora puede verificar exhaustivamente la rama en ChatHeaderActions.tsx:62. Sin regresiones. Resto del diff es ruido de formato en archivos .flow/
## Evidence
- Commits:
- Tests:
- PRs:
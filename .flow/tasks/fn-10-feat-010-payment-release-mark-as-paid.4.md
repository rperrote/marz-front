---
satisfies: [R2, R3, R6, R7]
---

## Description

Implementar el sidesheet `Mark as paid` con flujo en 2 pasos:

1. **Step `amount`**: GET `payment-suggestion` al abrir, prefill del campo `amount`, mostrar nota textual derivada del `speed_bonus_reason` (5 valores enum), botón `Confirm` deshabilitado si `amount ≤ 0` o > 2 decimales.
2. **Step `final_confirmation`**: dialog shadcn separado "¿Confirmás que ya pagaste $X de la marca a {creator}?" → dispara `useMarkDeliverableAsPaid()` mutation.

Mostrar errores tipados del backend en toast / mensaje inline (mapeo de códigos en R6 del epic). Disparar analytics `payment_mark_opened`, `payment_mark_amount_overridden`, `payment_mark_cancelled` con step actual.

**Size:** M
**Files:**

- `src/features/payments/markAsPaid/MarkAsPaidSidesheet.tsx` (nuevo)
- `src/features/payments/markAsPaid/MarkAsPaidSidesheet.test.tsx` (nuevo)
- `src/features/payments/markAsPaid/MarkAsPaidConfirmDialog.tsx` (nuevo)
- `src/features/payments/markAsPaid/usePaymentAnalytics.ts` (nuevo)
- `src/features/payments/markAsPaid/index.ts` (re-exports)
- `tests/e2e/payments/mark-as-paid.spec.ts` (nuevo, Playwright)

## Approach

- Patrón referencia: `Sidesheet/SendOffer` ya existente (FEAT-005/006). Reusar primitives shadcn (Sheet, Dialog, Input, Button) — sin nuevas deps.
- Estado local con `useState`: `step: 'amount' | 'final_confirmation'`, `amount: string`, `hasOverridden: boolean`.
- Pre-fill desde el suggestion: cuando llega la response, setear amount inicial. Si user cambia → `hasOverridden=true` → analytics `payment_mark_amount_overridden` (disparar 1 vez por sesión del sidesheet con debounce o on-blur).
- Validación de amount: client-side mismatch del backend (≤0, >2 decimales). Mostrar mensaje inline con `aria-live="polite"`.
- Mutation `onSuccess`: cerrar sidesheet (no esperar al WS — el backend ya confirma 201). Las invalidations cross-component las maneja el WS handler (task .3).
- Mutation `onError`: parsear `error.code` y mapear a copy de spec; mostrar toast.
- Cancel/close en cualquier step → `payment_mark_cancelled` con `step` actual.

## Investigation targets

**Required**:

- `src/features/offers/sendOffer/*` — patrón de sidesheet (FEAT-005/006).
- `src/shared/api/mutator.ts` — shape de errores tipados retornados por el cliente.
- `src/features/payments/markAsPaid/usePaymentAnalytics.ts` — wrapper sobre `POST /api/v1/analytics/events` (crear; revisar cómo otras features dispatch analytics — buscar uso existente de `useAnalytics` o equivalente).
- `src/components/ui/sheet.tsx`, `src/components/ui/dialog.tsx` — primitives shadcn.

**Optional**:

- `src/features/offers/sendOffer/SendOfferSidesheet.tsx` — referencia visual y de UX (close/cancel handling).

## Design context

- **Components:** Sidesheet sigue el lenguaje de `Sidesheet/SendOffer` (`t9oYN`/`TwbRP`/`1TkFi`). Diálogo de confirmación es `Dialog` shadcn estándar.
- **Layout:** El sidesheet es saliente desde la derecha; el dialog de confirmación es modal centrado.
- **Tokens:** El monto destacado usa `--primary`. La nota de bonus usa `--muted-foreground`. Errores usan `--destructive`.
- **Accesibilidad:** Focus trap en sheet + dialog. `aria-label` en input de amount. Mensaje de error con `aria-live`. Cierre con Escape.
- **Pencil status:** El sidesheet está marcado como `[PENDIENTE: pencil]` en el spec. Implementar siguiendo design system tokens; flagear el PR para review visual de diseño.

Full design system: `src/styles.css` + `marz-design/marzv2.pen` (Pencil MCP).

## Acceptance

- [ ] Al montar el sidesheet con `deliverableId`, dispara GET `payment-suggestion`. Mientras carga: skeleton/spinner. Si error 403/404/409: mostrar mensaje y botón cerrar.
- [ ] Al recibir suggestion, el campo `amount` viene pre-completado con `suggested_amount` y se muestra la nota correcta para cada uno de los 5 `speed_bonus_reason` (`included`, `not_applied_deadline_missed`, `not_applicable_multistage`, `not_declared`, `prorated_bundle`).
- [ ] Botón `Confirm` deshabilitado si `amount ≤ 0` o tiene >2 decimales. Mensaje inline `aria-live` cuando inválido.
- [ ] Click en `Confirm` → abre `MarkAsPaidConfirmDialog` con copy "¿Confirmás que ya pagaste $X…?". Cancelar el dialog → vuelve al step amount sin disparar mutation.
- [ ] Confirm en el dialog → dispara `useMarkDeliverableAsPaid()`. Spinner en el botón hasta resolver.
- [ ] `onSuccess`: cerrar sidesheet. (No optimistic update; las invalidations vienen del WS handler.)
- [ ] `onError`: surface según código:
  - `409 deliverable_not_completed` → toast "This deliverable is not ready to be marked as paid".
  - `409 deliverable_already_paid` → toast "This deliverable was already marked as paid".
  - `403 not_brand_owner` → toast "Only the workspace owner can mark payments".
  - `422 invalid_amount` → mensaje inline en el campo.
- [ ] Analytics: `payment_mark_opened` al montar (1 vez), `payment_mark_amount_overridden` al primer cambio del amount (1 vez por apertura), `payment_mark_cancelled` con `step` al cerrar sin confirmar.
- [ ] E2E Playwright: brand owner abre `LinkApprovedCard` en deliverable completed → sidesheet aparece → confirm → conversation muestra `PaymentCard` saliente.
- [ ] E2E: brand member (no owner) navega a la conversation y NO ve la acción `Mark as paid` en ningún surface (cubierto en task .5, este task verifica el guard del sidesheet rechaza si se invoca programáticamente).
- [ ] Accesibilidad: focus trap, ESC cierra sheet/dialog, aria-labels presentes.

## Done summary
fixtures.ts: fixture chatPairWithCompletedDeliverable correcto — cleanup exhaustivo en todos los paths de error, deliverableId resuelto via API autenticada con header correcto, ChatPair.deliverableId opcional no rompe fixtures existentes. mark-as-paid.spec.ts: guard test usa deliverableId real y falla explícito si el fixture no lo provee. Sin issues bloqueantes en el diff.
## Evidence
- Commits:
- Tests:
- PRs:
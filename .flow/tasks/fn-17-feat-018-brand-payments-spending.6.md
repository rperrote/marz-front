---
satisfies: [R7]
---

## Description

Click en fila de pagos navega a la conversation existente con search param `highlightPaymentId=<declared_payment_id>`. La conversation route consume el param y resalta visualmente la `PaymentCard` correspondiente; si el mensaje no está en la página actual, mostrar fallback no bloqueante (la conversation queda abierta sin loop infinito).

**Size:** M
**Files:**

- `src/features/payments/components/BrandPaymentsTable.tsx` (modificar: row click → navigate)
- `src/routes/workspace.conversations.$conversationId.tsx` (modificar: agregar `highlightPaymentId` a `validateSearch`)
- `src/features/chat/components/MessageTimeline.tsx` o equivalente (modificar para honrar highlight)
- `src/features/chat/components/PaymentCard.tsx` (modificar: aceptar prop `highlighted` y aplicar estilo)
- Tests + un E2E mínimo

## Approach

- Row click usa `navigate({ to: '/_brand/workspace/conversations/$conversationId', params: { conversationId }, search: { highlightPaymentId } })`.
- Emitir analytics `brand_payment_opened` antes/durante el navigate.
- En la ruta de conversation, ampliar `validateSearch` Zod para incluir `highlightPaymentId: z.string().uuid().optional()`.
- En `MessageTimeline`, leer el search param. Cuando el mensaje cuyo payload `declared_payment_id === highlightPaymentId` está en la lista actual, marcar `highlighted={true}` y hacer scroll-into-view.
- Si no está en la primera página: NO loopear paginando indefinidamente. Mostrar un banner/inline no bloqueante ("Pago no visible en mensajes recientes"), o cargar una página adicional como mucho. Mantener la conversation abierta y funcional.
- Estilo highlight: usar tokens shadcn (`--ring` o `--accent`), animación corta o borde temporal.

## Investigation targets

**Required:**

- `src/routes/workspace.conversations.$conversationId.tsx` — `validateSearch` actual + cómo lee mensajes.
- `src/features/chat/components/PaymentCard.tsx` — estructura del payload y dónde se renderiza.
- `src/features/chat/components/MessageTimeline.tsx` (o equivalente) — cómo se itera la lista de mensajes y patrón de scroll.
- FEAT-010 specs (`fn-10-feat-010-payment-release-mark-as-paid`) — confirmar que `PaymentCard` está persistida y trae `declared_payment_id` en payload.

**Optional:**

- Otros casos de "highlight" en el repo (si existen) para mantener consistencia visual.

## Design context

- Highlight visual: borde con `--ring` o fondo `--accent/10`, transición suave. Sin emojis.
- Respetar tokens shadcn dark/light.
- Scroll suave (`scroll-behavior: smooth` o equivalente programático).

## Acceptance

- [ ] `validateSearch` de la ruta de conversation incluye `highlightPaymentId` (uuid opcional).
- [ ] Click en fila navega a conversation correcta con el search param.
- [ ] Analytics `brand_payment_opened` se emite.
- [ ] `PaymentCard` cuyo payload `declared_payment_id === highlightPaymentId` se renderiza resaltada y entra en viewport.
- [ ] Si el mensaje no está cargado, fallback no bloqueante: conversation queda abierta y muestra indicador inline; sin loop de paginación.
- [ ] Tests: validateSearch acepta el param, render highlight cuando el mensaje está, fallback cuando no está.
- [ ] E2E mínimo: row click → conversation → highlight visible.

## Done summary
Los tres issues del round anterior resueltos correctamente: scroll one-shot con ref guard, fallback visible como banner estático fuera de Virtuoso, y comentario RAFITA:ANY presente.
## Evidence
- Commits:
- Tests:
- PRs:
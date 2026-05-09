---
satisfies: [R7]
---

## Description

Disparar el evento de analytics `payment_card_seen` la primera vez que un creator ve un `PaymentMarkedCard` entrante en su viewport. El evento se trackea via `IntersectionObserver` y se dispara solo una vez por card (aunque entre/salga del viewport múltiples veces).

**Size:** S
**Files:**

- `src/features/chat/components/systemEvents/PaymentMarkedCard.tsx` (modificar — agregar IO hook)
- `src/features/payments/markAsPaid/usePaymentAnalytics.ts` (modificar — agregar `trackCardSeen`)
- Test unitario y E2E acompañando.

## Approach

- Agregar `useIntersectionObserver` (o hook equivalente del repo si existe) en `PaymentMarkedCard`.
- Solo aplica cuando `viewer.kind === 'creator'` (variante entrante). Para brand: no-op.
- Estado local `hasFiredRef = useRef(false)`. Al primer entry con `isIntersecting`, dispara `trackCardSeen({ declared_payment_id })` y setea el ref. No re-disparar.
- Cleanup del observer al desmontar.

## Investigation targets

**Required**:

- `src/features/chat/components/systemEvents/PaymentMarkedCard.tsx` (creado en task .3).
- `src/features/payments/markAsPaid/usePaymentAnalytics.ts` (creado en task .4).
- Buscar en `src/shared/hooks/` un `useIntersectionObserver` existente; si no, implementar inline con `useEffect` + `IntersectionObserver` nativo (no agregar dep nueva).

## Acceptance

- [ ] Test unitario con mock de `IntersectionObserver`: dispara exactamente 1 vez aunque la card aparezca en viewport N veces.
- [ ] Test unitario: brand viewer → no dispara `payment_card_seen`.
- [ ] Test unitario: cleanup del observer al unmount (no leaks).
- [ ] E2E Playwright: creator entra a conversation con card nueva en viewport → request a `POST /api/v1/analytics/events` con name=`payment_card_seen`.
- [ ] E2E: scroll que oculta y vuelve a mostrar la card → no se duplica el evento.

## Done summary
Bounded context resuelto con shared/analytics/paymentCardSeen.ts, fixture separado para scroll con count independiente, waitForTimeout eliminado por expect.poll. Todos los acceptance criteria de la spec cubiertos.
## Evidence
- Commits:
- Tests:
- PRs:
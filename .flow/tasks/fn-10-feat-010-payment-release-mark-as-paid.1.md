## Description

Regenerar el cliente Orval contra el backend de dev tras que FEAT-010 backend exponga los endpoints `GET /api/v1/deliverables/{id}/payment-suggestion` y `POST /api/v1/deliverables/{id}/mark-as-paid`, junto con los nuevos enums (`DeliverableStatus='paid'`, `MessageEventType='PaymentMarked'`, `analytics.EventName` con los 7 valores nuevos).

**Size:** S
**Files:** `src/shared/api/generated/**` (no commiteado), `openapi/spec.json` (snapshot remoto si aplica)

## Approach

- Ejecutar `pnpm api:sync` apuntando al backend dev (variable `OPENAPI_URL` ya configurada en `package.json` o `.env`).
- Verificar que TypeScript compile (`pnpm typecheck`).
- Confirmar que aparezcan los hooks/tipos esperados (ver Acceptance).
- No hacer cambios manuales en `generated/`. Si el backend devuelve shape inesperado, parar y alinear con el equipo de `marz-api`.

## Investigation targets

**Required**:

- `package.json` — script `api:sync` y configuración Orval.
- `src/shared/api/mutator.ts` — handler de auth/errores que envuelve los hooks generados.
- `src/shared/api/generated/deliverables/deliverables.ts` — shape de hooks Orval existentes (referencia).
- `src/shared/api/generated/model/deliverableDTOStatus.ts` — enum a extender con `paid`.

## Key context

- `.gitignore` excluye `src/shared/api/generated/**`. No commitear los archivos.
- El cliente Orval inyecta `mutator.ts` para Bearer token de Clerk. Los hooks generados quedan automáticamente integrados.

## Acceptance

- [ ] `pnpm api:sync` corre sin errores y genera/regenera archivos en `src/shared/api/generated/`.
- [ ] `pnpm typecheck` pasa.
- [ ] Existe el hook `useGetDeliverablePaymentSuggestion` (o nombre equivalente Orval) en `src/shared/api/generated/payments/` o `deliverables/`.
- [ ] Existe el mutation hook `useMarkDeliverableAsPaid` (o equivalente).
- [ ] Existen los schemas Zod y tipos TS: `PaymentSuggestionResponse`, `MarkAsPaidRequest`, `MarkAsPaidResponse`, `DeclaredPayment`.
- [ ] El enum `DeliverableStatus` incluye `'paid'`; `MessageEventType` incluye `'PaymentMarked'`.
- [ ] Test mínimo: importar `useMarkDeliverableAsPaid` en un archivo dummy `.test.ts` compila.

## Done summary
toMessagePayload extraída a utils compartido, imports correctos, sin duplicación, sin dead code, typecheck y tests pasan
## Evidence
- Commits:
- Tests:
- PRs:
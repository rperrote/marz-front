---
satisfies: [R7]
---

## Description

E2E desktop con Playwright cubriendo el flujo completo: entrada, filtros (incluyendo `niches` + `interests`), brief, postulación, estado enviado por respuesta inline. Multi-tab refresh manual reconcilia estado.

**Size:** M
**Files:**

- `tests/e2e/creator-campaign-board.spec.ts` (Playwright)
- `tests/e2e/fixtures/creator-onboarded.ts` (si no existe, fixture de auth)
- `tests/e2e/fixtures/campaign-board-mocks.ts` (mocks de endpoints si E2E corre contra mock server)

## Approach

- Decidir entre dos modos según el patrón ya establecido en el repo:
  - **Mock backend** (Playwright `route.fulfill`): preferido si no hay backend dev disponible en CI.
  - **Backend dev real**: requiere `marz-api` corriendo (B.7 hecho) y data sembrada.
- Escenarios:
  1. Creator onboarded entra a `/_creator/campaigns`, ve grid con N cards.
  2. Aplica filtro `niches`, verifica que la lista se actualiza y URL refleja el cambio.
  3. Aplica filtro `interests` adicional, verifica que se combinan independientemente.
  4. Cambia sort a `fee_desc`, verifica orden.
  5. Click `Ver brief` abre sheet con contenido; cierra con Escape.
  6. Click `Postularme`, escribe message, envía.
  7. Verifica card en estado `Postulación enviada` sin recargar (respuesta inline).
  8. Abre segunda tab del board, verifica que NO ve estado enviado (no hay WS); refresh manual y ahora sí lo ve.
- Brand redirect: test rápido que un brand-authed user no puede entrar a `/_creator/campaigns` (cubre R1 lateralmente).

## Investigation targets

**Required:**

- `playwright.config.ts` y `tests/e2e/` existentes para igualar setup
- Fixtures de auth existentes (Clerk session mock o real)
- `package.json` script `test:e2e`

**Optional:**

- README e2e si existe

## Acceptance

- [ ] E2E cubre los 8 escenarios listados
- [ ] Multi-tab: tab2 sin refresh sigue mostrando `Postularme`; tras refresh muestra `Postulación enviada`
- [ ] Brand-authed user redirect verificado
- [ ] `pnpm test:e2e --grep "creator campaign board"` pasa local

## Done summary
Fix aplicado: matcher del link en brand redirect corregido a /Nueva campaña/i, que coincide con el texto real del componente.
## Evidence
- Commits:
- Tests:
- PRs:
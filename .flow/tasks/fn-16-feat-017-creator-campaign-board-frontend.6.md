---
satisfies: [R4, R8]
---

## Description

Dialog de postulación con textarea (1..2000), submit con `Idempotency-Key` UUID v4. Maneja `409 application_already_exists`, `409 idempotency_conflict`, `409 campaign_not_available`. Aplica `card_patch` para evitar doble submit. NO espera WS (no existe en MVP).

**Size:** M
**Files:**

- `src/features/discovery/campaign-board/ApplicationDialog.tsx`
- `src/features/discovery/campaign-board/CampaignBoardCard.tsx` (modificar: wire `Postularme`)
- `src/features/discovery/campaign-board/CampaignBriefSheet.tsx` (modificar: CTA `Postularme` desde el sheet también)
- `src/features/discovery/campaign-board/utils/idempotencyKey.ts` (UUID v4 generator wrapper)
- Tests unitarios + axe

## Approach

- `ApplicationDialog` controla estado interno: `message`, `idempotencyKey` (regenera al abrir y al `409 idempotency_conflict`).
- TanStack Form (CLAUDE.md raíz) para validación reactiva: required, trim, 1..2000.
- Submit usa `useSubmitCampaignApplicationMutation` (F.2). En éxito:
  - Aplica `card_patch` a queries en cache (lo hace el hook).
  - Cierra dialog.
  - Toast `Postulación enviada`.
- Errores:
  - `409 application_already_exists` → cerrar dialog, toast con link `Ver postulación` que navega/abre detail.
  - `409 idempotency_conflict` → regenerar key, reintentar 1 vez automático; si vuelve a fallar mostrar error recuperable.
  - `409 campaign_not_available` → cerrar dialog, invalidar list + detail, toast informativo.
  - `422 validation.*` → error inline en textarea.
- `Postularme` deshabilitado en card cuando `application.can_apply=false` o status≠`none`. Cuando ya hay submission, mostrar pill `Postulación enviada` + link.

## Investigation targets

**Required:**

- `src/features/discovery/campaign-board/hooks/useSubmitCampaignApplicationMutation.ts` (de F.2)
- `src/shared/ui/dialog.tsx` (shadcn dialog en el repo)
- TanStack Form usage en otra feature
- `crypto.randomUUID()` (web standard, sin dep extra)

**Optional:**

- `marz-front/CLAUDE.md` Section 1-4 (push back si surge complejidad innecesaria)

## Design context

- Dialog redondeado, padding generoso. Textarea con contador 0/2000.
- Botón primario `Enviar postulación` con loading state durante mutation.

## Acceptance

- [ ] Message vacío deshabilita submit; muestra error inline al blur
- [ ] > 2000 chars muestra error inline y bloquea submit
- [ ] Submit envía header `Idempotency-Key` UUID v4 (verificar en test mockeando la server fn)
- [ ] Success aplica `card_patch` a la query del board y cierra dialog
- [ ] `409 application_already_exists` muestra estado enviado + link `Ver postulación`
- [ ] `409 idempotency_conflict` regenera key y reintenta 1 vez automático
- [ ] `409 campaign_not_available` invalida queries y cierra
- [ ] Axe sin violations críticas en dialog abierto

## Done summary
Los tres fixes del round anterior están aplicados: applyBackendFieldErrors para 422, form.SubmitButton en lugar de Subscribe+Button manual, y validators solo onChange. El resto del diff no introduce problemas nuevos.
## Evidence
- Commits:
- Tests:
- PRs:
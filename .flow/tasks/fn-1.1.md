# fn-1.1 F.0a — OpenAPI spec.json escrito a mano (base Orval)

## Description
Correr pnpm api:sync para generar spec y orval

## Acceptance
- [ ] `openapi/spec.json` existe y valida OpenAPI 3.0+.
- [ ] Todos los schemas enum del solution doc están listados explícitamente.
- [ ] `pnpm api:generate` emite `src/shared/api/generated/endpoints.ts` + `src/shared/api/generated/model/` sin errores.
- [ ] Hooks esperados presentes: `useMe`, `useSetKind` (o `useSetMeKind`), `useCompleteBrandOnboarding`, `useCompleteCreatorOnboarding`, `useBrandEnrichment`, `usePresignAvatar`.
- [ ] Zod schemas generados cubren todos los payloads.
- [ ] `src/shared/api/generated/` está committeado con `.gitattributes` marcándolo `linguist-generated=true` (si falta, agregar la línea).
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

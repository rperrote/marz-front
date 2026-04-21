# fn-1.1 F.0a — OpenAPI spec.json escrito a mano (base Orval)


## Description

Escribir `openapi/spec.json` a mano con los paths + schemas de `03-solution.md §4.1-§4.3`. Esta es la base para que Orval genere tipos y hooks antes de que `marz-api` exista.

Incluye:
- `GET /v1/me` → `MeResponse` (con `onboarding_status: kind_pending|onboarding_pending|onboarded`, `kind: brand|creator|null`, `redirect_to`).
- `POST /v1/me/kind` → `KindSelectionRequest`.
- `POST /v1/onboarding/brand:complete` → `BrandOnboardingPayload` + sub-schemas (`Attribution`, `BrandfetchSnapshot`, enums de vertical, marketing_objective, creator_experience, monthly_budget_range, timing, attribution_source).
- `POST /v1/onboarding/creator:complete` → `CreatorOnboardingPayload` (+ `CreatorChannel`, `CreatorRateCard`, `CreatorBestVideo`, enums tier, experience_level, niches, content_types, gender, platform, format).
- `GET /v1/onboarding/brand/enrichment` → `BrandEnrichment`.
- `POST /v1/uploads/avatar:presign` → request `{content_type, content_length}`, response `{upload_url, s3_key, expires_at}` (asumido por §7.6 task B.18).
- Schema `Error` global con `details.field_errors`.
- `securitySchemes.bearerAuth` con bearer token.

Correr `pnpm api:generate` para validar que Orval parsea sin error.

## Acceptance

- [ ] `openapi/spec.json` existe y valida OpenAPI 3.0+.
- [ ] Todos los schemas enum del solution doc están listados explícitamente.
- [ ] `pnpm api:generate` emite `src/shared/api/generated/endpoints.ts` + `src/shared/api/generated/model/` sin errores.
- [ ] Hooks esperados presentes: `useMe`, `useSetKind` (o `useSetMeKind`), `useCompleteBrandOnboarding`, `useCompleteCreatorOnboarding`, `useBrandEnrichment`, `usePresignAvatar`.
- [ ] Zod schemas generados cubren todos los payloads.
- [ ] `src/shared/api/generated/` está committeado con `.gitattributes` marcándolo `linguist-generated=true` (si falta, agregar la línea).

## Done summary

## Evidence
- Commits:
- Tests:
- PRs:
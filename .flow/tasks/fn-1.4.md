# fn-1.4 F.2 — Generar tipos Orval (api:generate local)


## Description

Tipos Orval regenerados localmente desde `openapi/spec.json` (que viene de F.0-openapi en este epic).

- `pnpm api:generate` (no `api:sync` porque no hay backend dev todavía).
- Verificar output en `src/shared/api/generated/` + `src/shared/api/generated/zod/`.
- Committear generados.
- `.gitattributes` marca `src/shared/api/generated/** linguist-generated=true`.

## Acceptance

- [ ] `pnpm api:generate` emite endpoints + zod sin errores.
- [ ] `pnpm typecheck` limpio usando los hooks generados (smoke test: importar `useMe` en un archivo temporal y tipar).
- [ ] `.gitattributes` tiene la línea `src/shared/api/generated/** linguist-generated=true`.
- [ ] Commit del generated code incluido.

## Notas

El solution doc dice "F.2 depende de B.11 mergeado en dev". En este epic esa dependencia se reemplaza por F.0-openapi (spec local).

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

# fn-2.2 F.0a — Soportar FormData/multipart en mutator

## Description

# F.0a — Soportar `FormData` / multipart en `mutator.ts`

## Por qué

`POST /api/v1/campaigns/brief-builder/init` es `multipart/form-data` (URL + texto + PDF). El `customFetch` actual (`src/shared/api/mutator.ts`) hardcodea `Accept: application/json` y serializa JSON. Necesitamos que pase FormData tal cual y deje al browser setear el `Content-Type` con boundary.

## Scope

`src/shared/api/mutator.ts`:

- Detectar `body instanceof FormData`. Si lo es:
  - **No** setear `Content-Type` (browser lo hace con boundary).
  - No serializar (pasar tal cual a `fetch`).
  - Mantener `Accept: application/json` (la respuesta sigue siendo JSON).
- Auth/refresh (401 con `token_expired`/`token_invalid` → retry una vez) sigue funcionando igual.
- Errores tipados (`ApiError`) sin cambios.

`src/shared/api/mutator.test.ts` (crear si no existe; o agregar caso si existe):

- Test: `customFetch` con FormData no setea `Content-Type` y pasa el body sin serializar.
- Test: respuesta JSON se parsea OK.
- Test: 401 con FormData también dispara refresh + retry una vez.

## Notas

- Orval emitirá hooks con FormData cuando el spec OpenAPI declare `multipart/form-data` (depende de B.10 backend). Mientras eso no esté, F.2 hace el upload manual con FormData y este mutator.
- No agregar progreso de upload (XHR) — `fetch` no lo soporta y MVP no lo pide. Si más adelante hace falta, refactor.

## Acceptance

- `customFetch` con `body: FormData`: no se setea `Content-Type` en headers, body se pasa tal cual a `fetch`.
- `customFetch` con body JSON: comportamiento sin cambios (regresion test).
- 401 con FormData → refresh + retry una vez (regresion test).
- `ApiError` se construye igual ante 422 multipart.
- `pnpm test src/shared/api/mutator` verde con ≥3 casos nuevos.

## Done summary

TBD

## Evidence

- Commits:
- Tests:
- PRs:

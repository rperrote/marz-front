# fn-1.2 F.0b — Setup MSW + handlers + fixtures


## Description

Setup de MSW en `marz-front` para mockear todos los endpoints de la feature. Sin backend real, MSW es la única fuente de datos.

- Instalar `msw` como devDependency.
- Generar `public/mockServiceWorker.js` (`npx msw init public/ --save`).
- Estructura:
  ```
  src/shared/api/__mocks__/
    handlers/
      me.ts               # GET /v1/me, POST /v1/me/kind
      onboarding.ts       # POST /v1/onboarding/{brand,creator}:complete
      enrichment.ts       # GET /v1/onboarding/brand/enrichment
      uploads.ts          # POST /v1/uploads/avatar:presign + PUT a mock S3
      index.ts            # export all handlers
    fixtures/
      accounts.ts         # store in-memory de accounts mockeados
      brandfetch.ts       # logos + colors por dominio (stripe, nike, etc.)
      reserved-handles.ts # handles que disparan 409 handle_taken
    browser.ts            # setupWorker(handlers) — inicializa si VITE_ENABLE_MSW=1
    node.ts               # setupServer(handlers) — para Vitest
  ```
- Bootstrap en `src/router.tsx` o `src/integrations/tanstack-query/root-provider.tsx`: si `import.meta.env.VITE_ENABLE_MSW === '1'`, await `worker.start({ onUnhandledRequest: 'bypass' })` antes de montar la app. **`onUnhandledRequest: 'bypass'` es obligatorio** — ver epic spec §D3: las requests a Clerk (frontend-api, JWKS) **no** deben ser interceptadas por MSW.
- Bootstrap Vitest en `vitest.config.ts` o `src/test/setup.ts`: `beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' })); afterEach(() => server.resetHandlers()); afterAll(() => server.close());`.
- Exponer helpers `mockAccount(partial)`, `resetMocks()`, `registerUploadedAvatar(accountId, key)` para tests.

**Scope de paths** (§D3): cada handler declara path absoluto con prefijo `${import.meta.env.VITE_API_URL}/v1/...`. No wildcards. Ejemplo:
```ts
const API = import.meta.env.VITE_API_URL;
http.get(`${API}/v1/me`, ...);
http.post(`${API}/v1/me/kind`, ...);
```

**Mock S3 upload** (§D4): handler adicional intercepta `http.put('https://s3.mock.local/avatars/*', ...)` y devuelve 200 sin body. El handler de `/v1/uploads/avatar:presign` devuelve `upload_url` construido contra ese host (`https://s3.mock.local/avatars/{account_id}/{uuid}.{ext}`). Al recibir el PUT, llama `registerUploadedAvatar(accountId, key)` del fixture store para que `:complete` pueda validar `avatar_not_found`.

**Validación shared con form** (§D6): el handler de `POST /v1/onboarding/creator:complete` importa y usa `CreatorOnboardingPayloadSchema` de `src/features/identity/onboarding/creator/schema.ts` (mismo schema que usa C7 + submit final). Si falla `superRefine` → responde 422 `validation_failed` con `field_errors` derivados del `ZodError.issues`.

**Catálogo de errores soportados por handlers** (match §4.1.8):
- `token_invalid` / `token_expired` (401) — disparable con header `x-mock-error`.
- `auth_provider_unavailable` (503).
- `kind_already_set` (409) si el account ya tiene kind distinto.
- `invalid_kind` (422) si body manda algo fuera del enum.
- `invalid_state` (409) si `:complete` sobre account no en `onboarding_pending`.
- `validation_failed` (422) con `details.field_errors` — usar Zod parse del generated schema y mapear a `field_errors`.
- `handle_taken` (409) si handle ∈ reserved list.
- `avatar_not_found` (422) si `avatar_s3_key` no existe en fixture store.
- `rate_limited` (429) disparable con header.
- `enrichment_unavailable` (503) disparable con header.

**Fixtures enrichment**: preset para `stripe.com`, `nike.com`, `google.com`, `vercel.com` (logo_url placeholder + colores inventados). URLs desconocidas → 204.

## Acceptance

- [ ] `pnpm install` instala msw sin warnings.
- [ ] `pnpm dev` con `VITE_ENABLE_MSW=1` muestra `[MSW] Mocking enabled` en consola del browser.
- [ ] Todos los endpoints del catálogo responden (verificado manualmente con curl o DevTools Network).
- [ ] `pnpm test` corre con MSW server habilitado en setup; tests pueden usar `server.use(...)` para override por test.
- [ ] Helpers `mockAccount` y `resetMocks` exportados desde `src/shared/api/__mocks__/index.ts`.
- [ ] Fixtures determinísticos — dos runs del mismo test dan mismo resultado.
- [ ] MSW **NO** se carga si `VITE_ENABLE_MSW` no está en `1` (verificado: build de prod sin MSW en bundle).
- [ ] Request a `https://clerk.accounts.dev/...` (o cualquier host fuera de `${VITE_API_URL}` y `https://s3.mock.local/*`) **no** matchea ningún handler y pasa por fetch real (verificado con `onUnhandledRequest: 'bypass'` + test).
- [ ] Handler de `PUT https://s3.mock.local/avatars/*` responde 200 y registra el key en el fixture store.
- [ ] Handler de `:complete` creator usa el schema Zod compartido (§D6) — verificado importando desde `src/features/identity/onboarding/creator/schema.ts`.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

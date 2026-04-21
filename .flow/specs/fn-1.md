# fn-1 — FEAT-001 Signup/Signin + Onboarding (frontend, mocked backend)

> **Fuente canónica**: `marzv2/marz-docs/features/FEAT-001-signup-signin/03-solution.md`
> **Alcance de este epic**: SOLO frontend (`marz-front`). Tasks `F.1–F.19` del solution doc. Backend (`marz-api`) no existe todavía — todos los endpoints se mockean con MSW.

## Overview

Implementar en `marz-front` el flujo completo de:

1. **Sign in / Sign up** vía Clerk magic link (único método). Pantallas `/auth`, `/auth/check-email`, `/auth/link-invalid`, `/auth/callback`.
2. **Selección de kind** post sign-up (`/auth/kind`) — `brand` o `creator` (agencia disabled, "Próximamente").
3. **Onboarding brand**: 14 pantallas con data (B1-B14) + confirmación. Captura nombre, URL, vertical, objetivo, experiencia, budget, timing, contacto, atribución. Enriquecimiento opcional via Brandfetch (mockeado).
4. **Onboarding creator**: 20 pantallas (C1-C20). Captura handle, experiencia, tier, niches, content types, canales + rate cards, 3 videos, cumpleaños, género, ubicación, WhatsApp, referral, foto.
5. **Guards** de ruta según `onboarding_status` + `kind`.
6. **Desktop-only** (spec §D-14): detectar mobile y redirigir a `/desktop-only`.
7. **Sign-out** en shells brand/creator.

## Scope

### In scope
- 19 tasks `F.1`–`F.19` del solution doc §7.9.
- MSW setup (task F.0) cubriendo los endpoints de §4.1.
- `openapi/spec.json` escrito a mano desde §4.1-§4.3 (base para Orval).

### Fuera de scope (explícito)
- Backend real (`marz-api`). Endpoints mockeados con MSW.
- Pantallas `B15` (dashboard brand) y `C21` (dashboard creator).
- Stripe Connect (spec §D-10).
- Responsive mobile (spec §D-14) — solo pantalla "Abrí Marz desde tu computadora".
- Verificación real de handles sociales (spec §D-5).
- Persistencia de progreso parcial en backend (spec §D-4 — solo `sessionStorage` cliente).
- Emails transaccionales custom (los maneja Clerk).

## Approach

### Stack + decisiones técnicas clave

- **Auth**: `@clerk/tanstack-react-start` en modo magic link. `VITE_CLERK_PUBLISHABLE_KEY` nueva env var.
- **Cliente API**: Orval regenera `src/shared/api/generated/` desde `openapi/spec.json`. En este epic el spec se escribe a mano (no hay backend) con los paths del solution §4.1-§4.3.
- **Mocks**: **MSW** (`msw` devDep). Handlers en `src/shared/api/__mocks__/handlers/`. Se activan con `VITE_ENABLE_MSW=1` en dev/test, nunca en prod.
- **Forms**: TanStack Form + Zod schemas (generados por Orval + refinements para cross-field).
- **Estado parcial onboarding**: Zustand con `sessionStorage` (**NO** localStorage — spec §D-4). Un store por kind.
- **Routing**: TanStack Router file-based. Pathless groups `_brand`/`_creator` ya existen; se agregan guards reales.
- **Tokens**: Tailwind v4 + `src/styles.css` ya mapea tokens del `.pen`. Naming shadcn.
- **i18n**: Lingui ya está instalado. Strings nuevas se extraen con `pnpm i18n:extract`.

### Contrato mockeado (MSW)

Endpoints bajo `${VITE_API_URL}/v1/*`:

| Endpoint | Método | Propósito | Mock |
|---|---|---|---|
| `/v1/me` | GET | Estado account + `redirect_to` | Fixture in-memory por `clerk_user_id`; self-heal crea entry si no existe. |
| `/v1/me/kind` | POST | Settear kind | Idempotente mismo kind → 200; distinto → 409. |
| `/v1/onboarding/brand:complete` | POST | Completar onboarding brand | Valida payload con Zod; marca `onboarded`. Casos error programables por header. |
| `/v1/onboarding/creator:complete` | POST | Completar onboarding creator | Idem. Lista de handles reservados para simular `handle_taken`. |
| `/v1/onboarding/brand/enrichment?url=` | GET | Brandfetch proxy | Fixture por dominio; URLs desconocidas → 204. |
| `/v1/uploads/avatar:presign` | POST | Presigned S3 upload | URL ficticia + key; PUT a S3 también se mockea como 200. |

**Errores mockeados** (matches §4.1.8): `token_invalid`, `token_expired`, `auth_provider_unavailable`, `kind_already_set`, `invalid_kind`, `invalid_state`, `validation_failed` (`field_errors`), `handle_taken`, `avatar_not_found`, `rate_limited`, `enrichment_unavailable`.

### Estructura de archivos esperada

```
src/
  features/identity/
    auth/                       # pantallas magic link + callback + kind
    onboarding/
      brand/screens|components|store.ts
      creator/screens|components|store.ts
      shared/                   # OnboardingShell, Topbar, Footer, Progress, Field, chips, cards
      hooks/
  routes/
    auth.tsx, auth/{index,check-email,link-invalid,callback,kind}.tsx
    onboarding/{brand,creator}.tsx, onboarding/{brand,creator}.$step.tsx
    desktop-only.tsx
  shared/
    api/generated/              # Orval output
    api/__mocks__/{handlers,fixtures,browser.ts,node.ts}
    api/mutator.ts              # retry-on-401
    analytics/track.ts
openapi/spec.json
```

### Dependencias externas nuevas

- `@clerk/tanstack-react-start`
- `msw` (devDependency)

### Cross-epic

El solution doc marca dependencias a tasks backend (`B.6`, `B.9`, `B.10`, `B.11`, `B.14`, `B.18`). En este epic esas dependencias se cumplen con **MSW mocks** — no se bloquea ninguna F.X por backend.

Cuando el backend esté disponible: `pnpm api:sync` regenera contra el spec real. MSW queda deshabilitado con `VITE_ENABLE_MSW=0`. Los handlers MSW siguen usándose para Vitest.

## Decisiones técnicas canónicas

Estas decisiones son vinculantes para todas las tasks. Si una task las contradice, manda esta sección.

### D1 — SSR + Zustand persist (sessionStorage)

TanStack Start renderiza en Node; `sessionStorage` no existe server-side. Zustand `persist` con `createJSONStorage(() => sessionStorage)` crashea en hydration.

**Regla**: los stores de onboarding usan storage SSR-safe:

```ts
const storage = createJSONStorage(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage
);

export const useBrandOnboardingStore = create<BrandOnboardingState>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: 'marz-brand-onboarding',
      storage,
      skipHydration: true, // rehidratar manualmente tras mount client-side
    }
  )
);
```

En el layout client-only, `useEffect(() => { useBrandOnboardingStore.persist.rehydrate() }, [])`. Sin `skipHydration`, cualquier lectura del store durante SSR devuelve el estado inicial (no rompe, pero se documenta).

Aplica a `fn-1.13` (brand) y `fn-1.16` (creator).

### D2 — API real del SDK Clerk

`@clerk/tanstack-react-start` es el package nuevo (no `@clerk/clerk-react`). La API de magic link puede diferir del React SDK clásico.

**Regla**: antes de implementar `fn-1.8` (/auth P0) y `fn-1.11` (/auth/callback), hacer `WebFetch` a `https://clerk.com/docs/references/tanstack-react-start` + `https://clerk.com/docs/custom-flows/email-links` y confirmar:

- Nombre exacto del método para iniciar el flow email-link (puede no ser `signIn.create({strategy:"email_link"})`).
- Si la verificación del link se hace con un hook (`useSignIn().handleEmailLink(...)`) o con SDK global (`clerk.handleEmailLinkVerification()`).
- Props reales de `ClerkProvider` para TanStack Start (puede no aceptar `afterSignInUrl` — la prop puede llamarse `signInFallbackRedirectUrl` u otra).
- Integración con SSR: si requiere wrapper `<ClerkProvider>` + plugin de vite, o solo provider client-side.

Si la API difiere, actualizar `fn-1.3`, `fn-1.8`, `fn-1.9`, `fn-1.11` antes de codear. No inventar firmas.

### D3 — Scope de MSW

MSW **solo** intercepta `${VITE_API_URL}/v1/*` + el host del mock S3 (ver D4). **NO** debe interceptar:

- Dominios de Clerk (`clerk.accounts.dev`, `*.clerk.com`, frontend-api, JWKS, webhooks externos).
- Dominios de telemetry/analytics de terceros.
- Assets estáticos (`/_build`, `/assets`, etc.).

**Regla**: cada handler en `src/shared/api/__mocks__/handlers/*.ts` declara su path absoluto con prefijo `${import.meta.env.VITE_API_URL}/v1/...`. No usar `*` o `/api/*` wildcards.

Ejemplo:
```ts
const API = import.meta.env.VITE_API_URL; // ej. http://localhost:8080
export const meHandlers = [
  http.get(`${API}/v1/me`, ...),
  http.post(`${API}/v1/me/kind`, ...),
];
```

Fallback `onUnhandledRequest: 'bypass'` en `setupWorker` / `setupServer` para que cualquier request que no matchee pase por fetch real (Clerk no se rompe).

Aplica a `fn-1.2`.

### D4 — Host del mock S3 (presigned upload)

El mock de `POST /v1/uploads/avatar:presign` devuelve `upload_url` apuntando a un host ficticio controlado por MSW:

**Regla**:
- `upload_url = "https://s3.mock.local/avatars/{account_id}/{uuid}.{ext}"`.
- Handler MSW dedicado en `src/shared/api/__mocks__/handlers/uploads.ts` que intercepta `http.put("https://s3.mock.local/avatars/*", ...)` y responde 200 sin body.
- La key devuelta (`s3_key: "avatars/{account_id}/{uuid}.{ext}"`) es la que se persiste en store y se envía en `:complete`.
- El validator de `avatar_not_found` (422) del handler `:complete` verifica que el s3_key exista en el fixture store `accounts.ts` (`registerUploadedAvatar(accountId, key)` se llama en el PUT handler).

En prod real, el host será del bucket S3; el frontend solo lee `upload_url` del response, no hardcodea dominio.

Aplica a `fn-1.2` (handler S3) y `fn-1.17` (C17 avatar upload).

### D5 — Retry-on-401 con null-token guard

`clerk.session?.getToken()` puede devolver `null` si la session murió entre el 401 y el intento de refresh. Sin guard, el retry hace fetch sin `Authorization` header, recibe 401 de nuevo, y entra al signOut → loop silencioso si algo re-monta el provider.

**Regla**: en `src/shared/api/mutator.ts`, el retry-on-401:

```ts
if (response.status === 401 && errorCode in {token_invalid, token_expired} && !retried) {
  const newToken = await clerk.session?.getToken({ skipCache: true }).catch(() => null);
  if (!newToken) {
    await clerk.signOut();
    navigate('/auth');
    throw apiError;
  }
  // retry con newToken
}
```

Null-token nunca dispara un segundo fetch. El test unitario cubre este caso específicamente (no solo el happy path de refresh).

Aplica a `fn-1.5`.

### D6 — Zod refinements de C7 (channels)

Orval genera schemas Zod del OpenAPI pero **no** genera refinements cross-field. Las reglas de C7:

- `channels.length >= 1`.
- Exactamente un canal con `is_primary === true`.
- Dentro de un channel, los `rate_cards` tienen `(platform, format)` únicos.
- Los `format` permitidos dependen del `platform` (ig_* solo para instagram, etc.).

**Regla**: crear un archivo **único** `src/features/identity/onboarding/creator/schema.ts` que exporta:

```ts
export const creatorChannelsRefinement = (channels: CreatorChannel[], ctx: RefinementCtx) => {
  // length, is_primary, format por platform, rate_card dedup
};

export const CreatorOnboardingPayloadSchema = CreatorOnboardingPayloadGenerated
  .extend({ /* any extra */ })
  .superRefine((val, ctx) => {
    creatorChannelsRefinement(val.channels, ctx);
    // otros cross-field (best_videos length == 3, niches 1-5)
  });
```

Este schema se importa desde:
- El form de C7 (TanStack Form validator).
- El submit final en `fn-1.18` (Zod parse antes de enviar).
- El handler MSW `POST /v1/onboarding/creator:complete` (para devolver `validation_failed` con `field_errors` que matchean lo que el front validó).

Así la validación es idéntica en cliente y mock. Una sola fuente de verdad.

Aplica a `fn-1.2` (MSW handler importa), `fn-1.17` (C7 screen usa), `fn-1.18` (submit usa).

### D7 — Detección mobile en SSR

`window.innerWidth` no existe server-side. Opciones:
1. **Client-only** con `false` como default SSR → acepta flicker de 1 frame en mobile real.
2. **UA parsing server-side** (TanStack Start request context) → sin flicker pero requiere custom hook + passthrough desde el loader.

**Decisión**: opción 1 (client-only). Razones:
- La feature ya es desktop-only; mobile real es un caso edge (user abre el link de magic link en mobile).
- UA parsing agrega complejidad cross-stack y no vale el ahorro de 1 frame.
- En SSR `isMobile === false`, la pantalla de `/auth` se renderiza; client-side detecta mobile y navigate a `/desktop-only`. Flicker < 100ms, aceptable para un flow que se usa una vez.

**Regla**:

```ts
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false); // SSR-safe default
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};
```

El redirect a `/desktop-only` se dispara en `useEffect` (no durante render SSR), así no hay mismatch de hydration.

Aplica a `fn-1.20`.

## Quick commands

- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm dev` (con `VITE_ENABLE_MSW=1 VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` en `.env.local`)

## Acceptance

- [ ] Usuario sin session abre `/` → redirect a `/auth`.
- [ ] `/auth`: ingresa email → magic link Clerk → callback resuelve session → navega según `redirect_to`.
- [ ] Account nuevo cae en `/auth/kind` → elige brand/creator → entra a onboarding del kind.
- [ ] Onboarding brand: 14 pantallas Back/Next con validaciones locales. B1 dispara enrichment con debounce. B14 `:complete` → home brand.
- [ ] Onboarding creator: 20 pantallas (C7 multi-canal + rate cards + exactamente un primary; C10 exactamente 3 videos; C17 avatar upload). C20 `:complete` → home creator.
- [ ] Refresh (F5) dentro del onboarding preserva estado (sessionStorage). Cerrar tab y volver → arranca en paso 1.
- [ ] Guards: `/_brand/*` y `/_creator/*` requieren `onboarded` + kind correcto. Mismatch → redirect a `redirect_to` de `/v1/me`.
- [ ] Detección mobile (<1024px): redirige a `/desktop-only` si está en rutas de esta feature.
- [ ] Sign-out desde shell limpia stores + query cache + navega a `/auth`.
- [ ] MSW habilitado en dev con `VITE_ENABLE_MSW=1`. Endpoints responden según catálogo de errores.
- [ ] `pnpm typecheck` y `pnpm lint` limpios.
- [ ] Tests Vitest happy paths brand + creator + retry-on-401 + sessionStorage persistence.

## References

- `marz-docs/features/FEAT-001-signup-signin/03-solution.md` — documento técnico fuente (1351 líneas).
- Pencil `marzv2.pen` — DS `OnbScreenShell` (`hQXtH`), `OnbTopbar` (`4W3se`), `OnbProgress` (`w7qmh`), `OnbFooter` (`KrwlG`), `OnbField` (`PcSW6`), `OnbOptionChip` (`fQBHs`/`mH8KA`), `OnbVerticalCard` (`NrZHg`/`UFDvW`), `OnbContentTypeChip` (`xl1Zf`/`S1IXX`), `OnbTierCard` (`EQBOc`/`v4b1t`), `OnbSectionTitle` (`oty0b`), `OnbPaywallCard` (`h0bnQ`).
- `marz-front/CLAUDE.md` — convenciones del repo.
- `marzv2/CLAUDE.md` — workspace + pipeline.

## Overview

Frontend completo de FEAT-001: auth con Clerk magic link + onboarding brand (14 pantallas) + onboarding creator (20 pantallas). El backend se implementa en paralelo en `marz-api/fn-1`.

## Scope

- Instalar `@clerk/tanstack-react-start` y configurar `ClerkProvider` en modo magic link.
- Escribir `openapi/spec.json` a mano como contrato provisional (hasta que backend B.11 mergee) y generar tipos Orval desde él.
- Setup MSW para tests con handlers stub de los endpoints de auth/onboarding.
- Token provider Clerk + mutator con retry-on-401 (un retry, luego signOut).
- 9 componentes reusables de onboarding (shell, topbar, progress, footer, field, chips, cards).
- Wrapper analytics cliente (`track.ts`) — stub que loggea; plug-and-play futuro.
- Rutas auth: `/auth`, `/auth/check-email`, `/auth/link-invalid`, `/auth/callback`.
- Ruta `/auth/kind` + KindSelector (brand / creator / agency-disabled).
- Layout + store Zustand (sessionStorage) + máquina de pasos para brand (14 pasos) y creator (20 pasos).
- 14 pantallas brand B1-B14.
- 20 pantallas creator C1-C20 (la más compleja: C7 ChannelEditor).
- Triggers finales: `useCompleteBrandOnboarding` y `useCompleteCreatorOnboarding`.
- Guards reales en `_brand.tsx` y `_creator.tsx` (reemplazar stubs con lógica basada en `useMe`).
- Detección mobile + ruta `/desktop-only`.
- Sign out desde shells.
- Borrado de residuos pre-Clerk (login.tsx, session.ts).

## Approach

1. **F.0a + F.0b primero**: spec.json manual + MSW. Permite trabajar completamente offline sin backend.
2. **F.1 + F.A en paralelo**: Clerk setup + analytics wrapper (sin dependencias entre sí).
3. **F.2 + F.3 después**: generar tipos Orval desde spec.json + token provider / mutator.
4. **F.4**: componentes reusables onboarding (shadcn primitivos + tokens del .pen).
5. **Rutas auth (F.5-F.9)**: flujo magic link completo antes de arrancar onboarding.
6. **Onboarding brand (F.10-F.12)** y **creator (F.13-F.15)**: en paralelo si hay capacidad.
7. **Guards + cleanup (F.16-F.19)**: cierre del epic.

Cuando backend B.11 mergee: correr `pnpm api:sync` y reemplazar spec.json manual. Los hooks generados deben ser drop-in replacements de los stubs MSW.

## Quick commands

```bash
# Arrancar dev
pnpm dev

# Generar tipos desde spec.json local (sin backend)
pnpm api:generate

# Sincronizar desde backend dev (cuando B.11 esté mergeado)
pnpm api:sync

# Typecheck
pnpm typecheck

# Tests
pnpm test

# Lint
pnpm lint
```

## Key technical decisions

- **sessionStorage (no localStorage)** para store Zustand del onboarding — spec §D-4. Requiere SSR guard: `createJSONStorage(() => sessionStorage)` solo en browser.
- **Async token provider**: `mutator.ts` debe aceptar `() => Promise<string | null>`. Clerk `getToken()` es async.
- **`@clerk/tanstack-react-start`** (no `@clerk/clerk-react`) para SSR TanStack Start.
- **ClerkProvider** se monta en `__root.tsx` wrapeando `AppI18nProvider`.
- **Clerk appearance**: usar `appearance.variables` mapeados a `var(--primary)`, `var(--background)`, `var(--border)` para respetar tokens del .pen.
- **Zustand persist + SSR**: guard `typeof window !== 'undefined'` en storage factory.
- **Onboarding resumption**: sessionStorage sobrevive F5 en la misma tab; si cierra tab, reinicia desde B1/C1. La sesión server-side (`useMe`) dictamina el estado (`onboarding_pending`), pero los datos del form son client-only.
- **Mobile detection (F.17)**: `window.innerWidth < 1024` en `beforeLoad` de rutas auth/onboarding. `/desktop-only` es la única ruta sin bloqueo mobile.

## Riesgos y dependencias

- **F.2 + F.12 + F.15 + F.16 dependen de B.11** (OpenAPI backend). Mitigation: spec.json a mano (F.0a) desbloquea F.2 desde el inicio.
- **Clerk SSR**: `@clerk/tanstack-react-start` es relativamente nuevo; verificar peer deps contra versión de TanStack Start instalada.
- **C7 ChannelEditor** es la pantalla más compleja: add/remove canales, radio is_primary, rate_cards por formato. Scope completo en spec de fn-1.17.
- **Index.tsx**: usa sync `getSession()` — debe actualizarse junto con F.16, no está listado explícitamente pero es bloqueante.

## Acceptance

- `pnpm typecheck` pasa sin errores.
- `pnpm lint` pasa sin errores.
- Usuario puede completar magic link → kind selection → onboarding brand completo end-to-end en dev.
- Usuario puede completar magic link → kind selection → onboarding creator completo end-to-end en dev.
- Guards en `_brand` y `_creator` redirigen correctamente según `onboarding_status`.
- `/desktop-only` se muestra en ventana < 1024px en rutas auth/onboarding.
- Cerrar tab y volver reinicia onboarding desde paso 1.
- Sign out limpia stores + query cache + navega a `/auth`.

## References

- `marz-docs/features/FEAT-001-signup-signin/03-solution.md` §7 (Frontend plan completo)
- `marz-docs/features/FEAT-001-signup-signin/03-solution.md` §4 (Contrato API)
- `src/shared/api/mutator.ts` (a modificar en F.3)
- `src/routes/__root.tsx` (a modificar en F.1 para ClerkProvider)
- `src/shared/auth/session.ts` (a eliminar en F.19)
- `src/routes/login.tsx` (a eliminar en F.19)

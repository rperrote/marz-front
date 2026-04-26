# routing

File-based routing con TanStack Router. Cargar este archivo cuando agregues, muevas o modifiques rutas.

## Estructura

```
src/routes/
  __root.tsx            # HTML shell, theme init, devtools
  index.tsx             # redirige por kind
  login.tsx             # ruta pública
  health.tsx            # SSR healthcheck en /health
  auth/                 # rutas públicas de auth
  _brand.tsx            # pathless: guard kind=brand + BrandShell
  _brand/*.tsx          # rutas brand
  _creator.tsx          # pathless: guard kind=creator + CreatorShell
  _creator/*.tsx        # rutas creator
  onboarding/
    brand.tsx           # layout brand onboarding
    brand.$step.tsx     # step actual
    creator.tsx         # layout creator onboarding
    creator.$step.tsx   # step actual
```

## Dos shells por kind

`Account.kind` es `brand` o `creator`, nunca ambos. Cada grupo tiene su shell propio (no es "sidebar con otros items", son layouts conceptualmente distintos):

- `_brand.tsx` → `beforeLoad` chequea `session.kind === 'brand'`, redirige a `/login` o `/` si no.
- `_creator.tsx` → idem para creator.

Shells viven en `features/identity/components/BrandShell.tsx` y `CreatorShell.tsx`.

## Reglas para agregar rutas

- Pertenece a brand → `src/routes/_brand/<nombre>.tsx`.
- Pertenece a creator → `src/routes/_creator/<nombre>.tsx`.
- Pública (login, signup, callback) → `src/routes/<nombre>.tsx` o `src/routes/auth/<nombre>.tsx`.
- Onboarding → `src/routes/onboarding/<kind>.<step>.tsx`.

## Composición

Las rutas son **composición**, no definición de componentes nuevos. Instancian organismos de `features/<bc>/components/`. Lógica de fetching va en route loader o React Query hook desde el componente.

## Type-safe params y search

- Params via `useParams({ strict: true })` con la ruta tipada.
- Search params con Zod: definir `validateSearch` en el `createFileRoute`.
- Navegación con `useNavigate()` y `to: '/path'` con autocomplete.

## routeTree.gen.ts

Auto-generado en build/dev. Si `pnpm typecheck` falla con `Cannot find module './routeTree.gen'` después de un clone limpio, correr `pnpm build` o `pnpm dev` una vez.

## Rules of Hooks en layouts

Los layouts `brand.tsx` y `creator.tsx` que usan `useStore()` lo tienen que llamar **antes** de cualquier `return null` condicional. Violar esto desincroniza la suscripción y el store no re-renderiza al cambiar.

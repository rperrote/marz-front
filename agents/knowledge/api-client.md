# api-client

Orval + React Query + Zod. Cargar este archivo cuando consumas endpoints, definas mutations, o aparezcan cambios de contrato.

## Source of truth

`marz-api/openapi.yaml` (o `/openapi.json` servido por backend dev en `localhost:8080`). El frontend NO define el contrato.

## Flujo de sync

```
pnpm api:sync       # fetch spec del dev backend → openapi/spec.json → regenera Orval
pnpm api:generate   # regenera desde openapi/spec.json local (sin refetch)
```

## Outputs generados

- `src/shared/api/generated/endpoints.ts` (+ `model/`, `accounts/`, `onboarding/`, etc.) — hooks React Query por tag (`useGetCampaigns`, `useCreateCampaignMutation`).
- `src/shared/api/generated/zod/` — schemas Zod para validar requests/responses.

**Committeamos el output.** Razones: reproducibilidad, desacople de deploys, diff visible en review. `.gitattributes` los marca `linguist-generated=true`.

## Cuándo regenerar

- Backend mergea cambio de contrato → `pnpm api:sync` → revisar diff → commit.
- Antes de PR si la feature depende de endpoints nuevos.
- NO regenerar a la ligera mientras backend está iterando (te trae cambios incompletos).

## Mutator custom

`src/shared/api/mutator.ts` centraliza:

- Auth token via `setAuthTokenProvider()`.
- `AbortSignal` para cancelar queries.
- Serialización JSON / FormData.
- Errores tipados con `ApiError` (ver `errors.md`).
- Retry on 401.

Orval genera hooks que usan este mutator. No reimplementar fetch a mano.

## Uso típico

```tsx
const meQuery = useMe({ query: { enabled: isLoaded && !!isSignedIn } })
const me = meQuery.data
if (me?.status === 200) {
  const onboardingStatus = me.data.onboarding_status
}

const mutation = useSelectKind()
mutation.mutate(
  { data: { kind: 'brand' } },
  {
    onSuccess: (response) => {
      /* response.status === 200 → response.data */
    },
    onError: (err) => {
      /* err instanceof ApiError */
    },
  },
)
```

## NO

- Editar manualmente nada en `src/shared/api/generated/`. Si un campo está mal, fixearlo en backend y resync.
- Agregar fetch a mano a endpoints existentes. Si el endpoint existe en el spec, hay un hook generado para él.
- Usar el `mutator` directamente desde un componente. Pasa por hooks Orval.

# errors

Manejo de errores y validación. Cargar cuando trabajes con mutations, error boundaries, o aparezcan toasts/banners.

## ApiError

`src/shared/api/mutator.ts` exporta `ApiError`. Toda respuesta no-2xx del backend lanza esta error class.

```ts
class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, message: string, body: unknown) {
    /* ... */
  }
}
```

## Pattern en mutations

```ts
mutation.mutate(payload, {
  onError: (err) => {
    if (err instanceof ApiError && err.status === 409) {
      // conflict — manejar específico
      return
    }
    if (err instanceof ApiError && err.status === 422) {
      setError(err.message)
      return
    }
    setError(t`Algo salió mal. Intentá de nuevo.`)
  },
})
```

Reglas:

- **422** → error de validación. Mostrar mensaje del backend en field específico o banner.
- **409** → conflict. Usualmente significa state stale. Refetch + retry o navegar.
- **401** → handled por `mutator.ts` (retry-on-401 con refresh de token Clerk).
- **403** → no permission. Probablemente bug de routing o guard fallido.
- **404** → recurso no existe. Navegar a un fallback o mostrar empty state.
- **5xx** → error genérico. Toast "Algo salió mal".

## Error boundaries

TanStack Router tiene `errorComponent` por route. Usar para errores no recoverables (ej. workspace borrado, sesión inválida que no se pudo refrescar).

NO usar error boundaries para flow control. Solo para errores genuinos.

## Validación de forms

Ver `forms.md`. Errores de fields se mapean a `OnboardingField error="..."` o equivalente. NO mostrar 422 como toast — es error de field, va inline.

## Toasts

Usamos `sonner` (chequear `package.json`). Solo para:

- Acciones exitosas que no tienen feedback visual obvio (ej. "Copiado").
- Errores genéricos que no son de field.
- Notificaciones de sistema (ej. "Conexión perdida").

NO usar toasts para:

- Errores de validación de form.
- Confirmar acciones que ya tienen UI (ej. loading state).

## Logging

Para debug, `console.log` está bien en dev. ANTES de mergear: removerlos. Si hay logs útiles para producción, hablarlo con el equipo — no agregar `console.log` en código mergeado.

## Try/catch

Mínimo. React Query maneja errores async via `onError`. Use `try/catch` solo cuando:

- Hay async fuera de mutations (ej. file upload directo a S3).
- Necesitás manejar un error específico sin que lo capture el boundary.

NO `try/catch` para todo "por si acaso". Las funciones que pueden fallar lo dicen en su tipo.

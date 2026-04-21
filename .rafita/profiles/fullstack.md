# Fullstack Profile (Marz — cross-repo)

Perfil para tasks que tocan **`marz-api` (Go) + `marz-front` (TanStack Start)** en coordinación. Si la task vive en un solo repo, usar `backend-go.md` o `frontend.md`.

## DEV Rules

- Lee `CLAUDE.md` del proyecto y `marz-docs/architecture/overview.md`, `bounded-contexts.md`, `data-model.md`, `event-catalog.md`.
- Lee la **task épica de flow-next** y la **épica padre**.
- Si la task referencia `03-solution.md`, leelo como contexto.
- Detectá qué archivos toca la task:
  - Solo `marz-api/**` → seguí reglas de `backend-go.md`.
  - Solo `marz-front/**` → seguí reglas de `frontend.md`.
  - Ambos → aplicás las reglas de los dos en orden: backend primero, frontend después.
- Si backend cambia OpenAPI, **primero** actualizá `marz-api/openapi.yaml` y regenerá tipos server. Luego en frontend corré `pnpm gen:api` antes de consumir.
- Implementá SOLO lo que pide la task. Nada de scope creep entre repos.
- NO usar TodoWrite.
- Cargá skills de frontend cuando la task toca UI (via ToolSearch).

### Backend (resumen — ver `backend-go.md` para detalle)

- Hexagonal: `domain/` puro, `app/`, `adapters/`. No cross-importar.
- `sqlc` para queries, `pgx` para driver, `nhooyr/websocket` para WS.
- Errores de dominio tipados; mapeo en `adapters/http/errors.go`.
- Money: `decimal.Decimal` + currency. Nunca floats.
- Outbox pattern para eventos cross-context.
- `gofmt` + `goimports` + `golangci-lint` + `go test ./...`.

### Frontend (resumen — ver `frontend.md` para detalle)

- TanStack Start: rutas en `src/routes/`, server functions con `createServerFn` + Zod.
- TanStack Query para server state, TanStack Form para forms, Zustand para cliente.
- shadcn/ui + Tailwind con tokens del theme.
- Cliente API generado desde OpenAPI.
- `pnpm format` + `pnpm typecheck` + `pnpm test`.

### Coordinación API-consistencia

- Si cambiás request/response de un endpoint en backend, **debés** regenerar tipos en frontend **en la misma PR**. Si el front queda desactualizado, la task no está terminada.
- Si agregás evento WS nuevo en backend, debés agregarlo al cliente WS del frontend y al catálogo de eventos consumibles.
- Si agregás entidad nueva en DB, debés pensar el hook de frontend que la consume (o justificar por qué no aplica en esta task).

### Tests

- Backend: unit + integration como `backend-go.md`.
- Frontend: unit + E2E como `frontend.md`.
- Para tasks fullstack, **siempre** corré el E2E de Playwright end-to-end (front → back → DB).
- NO agregar comments/docstrings/type annotations a código que no cambiaste.
- Al terminar, output: `<done/>`.

## DEV Fix Rules

- Aplicá SOLO los fixes listados.
- Si el fix atraviesa ambos repos, resolvé backend primero, regenerá tipos, resolvé frontend.
- Corré format/typecheck/tests en cada repo antes de terminar.
- NO usar TodoWrite.
- Al terminar, output: `<done/>`.

## Review Rules

**Input del reviewer**: diff del branch + **task épica de flow-next** + épica padre. Leerlos antes.

Veredicto **estructurado obligatorio**:

```
APPROVED
```

o

```
REJECTED:
1. {repo}:{archivo:línea} — {qué está mal} — {qué hacer}
2. {repo}:{archivo:línea} — {qué está mal} — {qué hacer}
...
```

Sin texto adicional. Sin "LGTM con nits". Sin sugerencias cosméticas.

Chequeos obligatorios en orden:

1. **Cumple la task flow-next**.
2. **Backend**: aplicá el checklist de `backend-go.md` (hexagonal, errores, SQL, OpenAPI, eventos, seguridad, performance, concurrencia, logging, tests, migraciones).
3. **Frontend**: aplicá el checklist de `frontend.md` (stack TanStack, shadcn/design, accesibilidad, seguridad, performance, responsive, WS, validación visual, tests, TypeScript).
4. **Consistencia cross-repo**:
   - Cambios de endpoint en backend → tipos regenerados en frontend en el mismo branch.
   - Request/response schemas coinciden (mismo shape, mismos campos opcionales).
   - Eventos WS emitidos por backend → consumidos correctamente por frontend.
   - Estados de entidad (ej. `OfferStatus`) coherentes entre backend enum y tipos/discriminated unions del frontend.
5. **E2E integrado**: si la task es fullstack, el test E2E Playwright del happy path corre contra el stack levantado y pasa. REJECTED si no existe o falla.

Si todo pasa → `APPROVED`. Si falla cualquier punto → `REJECTED:` con lista numerada.

## Format Command

Ejecutar en cada repo modificado:

```
# marz-api
gofmt -w . && goimports -w . && golangci-lint run --fix

# marz-front
pnpm format && pnpm typecheck
```

## Skills

react-doctor, vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines

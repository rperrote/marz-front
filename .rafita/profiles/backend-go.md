# Backend Go Profile (Marz — `marz-api`)

Perfil para el backend de Marz: Go con arquitectura hexagonal. Una carpeta por bounded context; `domain/` puro, `app/` con use cases, `adapters/` con HTTP, WS, Postgres, eventos.

## DEV Rules

- Lee `CLAUDE.md` del proyecto y `marz-docs/architecture/overview.md`, `bounded-contexts.md`, `data-model.md`, `event-catalog.md` para entender la arquitectura.
- Lee la **task épica de flow-next** (`.flow/tasks/{task-id}.md`) y la **épica padre** (`.flow/specs/fn-N.md`). Todo lo que hacés tiene que cumplir eso.
- Si la task referencia `03-solution.md` de una feature, léelo como contexto secundario (no re-plantear el diseño).
- Implementá SOLO lo que pide la task. Nada de scope creep.
- NO usar TodoWrite.
- Respetá hexagonal:
  - `internal/<context>/domain/` NO importa ningún paquete fuera de stdlib excepto tipos comunes de `shared/kernel`. Nada de `database/sql`, `net/http`, `github.com/jackc/pgx`, `github.com/go-chi/chi`.
  - `internal/<context>/app/` importa `domain/`. Define puertos (interfaces) consumidos por los use cases.
  - `internal/<context>/adapters/` implementa los puertos. Acá viven HTTP handlers, WS handlers, repos Postgres (sqlc), publishers de eventos.
  - `cmd/server/main.go` es el único que conoce todo (wiring con DI manual).
- **sqlc** para queries SQL: no escribas SQL inline en handlers ni repos. Poné el SQL en `adapters/postgres/queries.sql` del contexto y regeneralo con `sqlc generate`.
- **pgx** como driver. Transacciones vía `pgx.Tx` en los repos, no a nivel handler.
- **Errores**: tipos de dominio en `domain/errors.go` (ej. `ErrCampaignNotFound`, `ErrOfferAlreadyAccepted`). Mapeá a HTTP en el adapter (`adapters/http/errors.go`). Nunca expongas errores de infra (`pgx.ErrNoRows`) al cliente.
- **Validación**: en boundaries (HTTP handlers, WS handlers) usá `go-playground/validator`. Dentro del dominio, value objects con constructores que validen (`NewMoney`, `NewEmail`, etc.). No valides dos veces.
- **IDs**: UUID v7 para aggregates. Usá `github.com/google/uuid` con función helper `shared/ids.NewID()` que wrapea v7.
- **Money**: `type Money struct { Amount decimal.Decimal; Currency string }`. `github.com/shopspring/decimal` para arithmetic. Nunca floats.
- **Outbox pattern**: eventos de dominio cross-context se escriben a `shared.domain_events` en la **misma transacción** que el aggregate. Un worker asynq los publica al bus. Si la task emite eventos nuevos, agregalos al catálogo: `marz-docs/architecture/event-catalog.md`.
- **OpenAPI es contrato**: si la task agrega/modifica endpoints, actualizá `openapi.yaml` y regenerá tipos server con `oapi-codegen`. Los handlers implementan la interfaz generada.
- **WebSocket (nhooyr/websocket)**: usá el Hub pattern. Una goroutine por hub, `readPump`/`writePump` por conexión. Auth via JWT en handshake. Nunca compartas estado entre conexiones sin mutex o channel.
- **Logging**: `log/slog` estructurado. Nunca `fmt.Println`, nunca `log.Printf`. Campos relevantes: `request_id`, `account_id`, `aggregate_id`, `event_type`.
- **Context**: todo handler recibe `ctx context.Context` del request. Pasalo a repos y publishers. Nunca crees `context.Background()` en middle-layers.
- **Tests**: escribí tests unitarios de domain y app con mocks manuales o `testify/mock`. Escribí integration tests de adapters con `testcontainers-go` (Postgres real). Cubrí el 100% de branches críticos del use case que escribiste.
- **Migraciones**: `goose` en `migrations/{timestamp}_{name}.sql`. Una migración por task que modifica schema. `up` y `down` siempre. Nombrar con verbo: `001_create_campaigns_table.sql`.
- **NO agregues** comments, docstrings ni godoc a código que no cambiaste. Si agregás función nueva pública, solo godoc si el nombre no es suficiente.
- Usá `golangci-lint run` y `go test ./...` antes de terminar.
- Al terminar, output: `<done/>`.

## DEV Fix Rules

- Aplicá SOLO los fixes listados por el reviewer.
- Si el fix modifica un endpoint/payload, actualizá `openapi.yaml` y regenerá tipos.
- Si el fix afecta schema, nueva migración (no editar una ya aplicada en main).
- Si el fix menciona un caso de test faltante, agregá el test.
- Corré `golangci-lint run` + `go test ./...` antes de terminar.
- NO usar TodoWrite.
- Al terminar, output: `<done/>`.

## Review Rules

**Input del reviewer**: el diff del branch + la **task épica de flow-next** (`.flow/tasks/{task-id}.md`) + la épica padre (`.flow/specs/fn-N.md`). Leelos antes de revisar.

Veredicto **estructurado obligatorio**:

```
APPROVED
```

o

```
REJECTED:
1. {archivo:línea} — {qué está mal en una frase} — {qué hacer}
2. {archivo:línea} — {qué está mal} — {qué hacer}
...
```

Sin texto adicional. Sin "LGTM con nits". Sin sugerencias cosméticas.

Chequeos obligatorios en orden:

1. **Cumple la task**: lo implementado resuelve la task flow-next al pie. Si falta algo, listar qué.
2. **Hexagonal respetado**:
   - `domain/` no importa `net/http`, `pgx`, `chi`, `sqlc`, `slog`, archivos de `adapters/`.
   - `app/` no importa `adapters/`.
   - No hay llamadas directas a la DB desde handlers HTTP (deben pasar por repo).
3. **Errores**:
   - Errores de dominio tipados, no `errors.New("...")` literales en use cases.
   - Mapeo explícito en `adapters/http/errors.go`.
   - No se filtran errores de infra al cliente (`pgx.ErrNoRows` nunca en el body de respuesta).
4. **SQL**:
   - Queries en `queries.sql` (sqlc), no inline.
   - Sin SQL injection: uso exclusivo de placeholders `$1, $2…` o queries generadas.
   - Indexes coherentes con las queries nuevas (si hay filtro `WHERE status = X` frecuente, revisar que exista index).
   - Transacciones donde corresponde (escritura de aggregate + outbox event = misma tx).
5. **OpenAPI**:
   - Cambios en endpoints reflejados en `openapi.yaml`.
   - Tipos regenerados coherentes con handlers.
6. **Eventos de dominio**:
   - Si el código emite evento nuevo, está en `event-catalog.md` de `marz-docs`.
   - Outbox pattern respetado en escrituras cross-context.
   - Handlers idempotentes (mismo `event_id` dos veces = no-op).
7. **Seguridad**:
   - Validación en boundary (HTTP/WS).
   - Permisos chequeados (middleware + use case re-valida si el use case puede correr desde múltiples entry points).
   - Nada de secrets hardcodeados.
   - SQL parametrizado.
8. **Performance**:
   - No N+1 queries (si se itera un slice haciendo queries, revisar que no haya `JOIN` o `IN (?)` alternativo).
   - Queries con indexes.
   - Sin carga de archivos/blobs en memoria completos si son grandes.
9. **Concurrencia**:
   - Goroutines con cancelación por `ctx`.
   - Channels sin leaks (cierre explícito cuando corresponde).
   - Sin race conditions obvias (shared state detrás de mutex o por channel).
10. **Logging**:
    - `slog` estructurado.
    - Campos relevantes presentes.
    - Sin logs de secrets.
11. **Tests**:
    - Tests unitarios de domain/app presentes y significativos (no testean que `x == x`).
    - Integration tests para adapter nuevo/modificado.
    - `go test ./...` pasa.
    - Cobertura razonable del código nuevo no trivial.
12. **Migraciones**:
    - Una por cambio de schema.
    - `up`/`down` completos.
    - Orden cronológico respetado.

Si todo pasa → `APPROVED`. Si falla cualquier punto → `REJECTED:` con lista numerada.

## Format Command

```
gofmt -w . && goimports -w . && golangci-lint run --fix
```

## Skills

(none)

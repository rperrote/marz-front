# Backend Go Project Profile

## DEV Rules

- Leé `CLAUDE.md`, `README.md`, y los `doc.go` del package afectado.
- Errores: usar `errors.Is` / `errors.As`; no comparar strings. Wrappear con `%w` cuando cruza package boundary.
- Context-aware: todas las funciones que hacen I/O reciben `ctx context.Context` como primer parámetro.
- No usar goroutines sin cancelación explícita (context o canal de stop).
- Validar input externo antes de procesarlo.
- NO uses TodoWrite. NO commitees. Al terminar, `<done/>`.
- NO instales herramientas externas (atlas, linters, etc.). Si falta algo, abortá la tarea y reportá "falta herramienta X" en el verdict.

## DEV Fix Rules

- Aplicá solo los fixes listados.
- Si el fix agrega logging, usar el logger del package (no `fmt.Println` en producción).
- Al terminar, `<done/>`.

## Review Rules

- [ ] Todos los errores se manejan (sin `_ = err` sin justificación).
- [ ] Las funciones que hacen I/O reciben y respetan `ctx`.
- [ ] Sin goroutines fugadas (leaks) — toda goroutine tiene una forma de terminar.
- [ ] Sin `time.Sleep` como sincronización.
- [ ] Sin secrets hardcoded.
- [ ] Si hay SQL, es parametrizado.
- [ ] Tests (table-driven preferido) cubren la lógica nueva.

## Plan Rules

(none)

## Format Command

gofmt -w . && goimports -w .

## Test Command

bash -c 'set -o pipefail; go test ./... -race -count=1 2>&1 | grep -v "\[no test files\]"'

## Lint Command

golangci-lint run ./...

## Typecheck Command

go vet ./...

## Skills

(none)

## Forbidden Paths

.env
.env.\*
vendor/**
bin/**

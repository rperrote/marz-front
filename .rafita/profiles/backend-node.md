# Backend Node.js Profile

## DEV Rules
- Lee el CLAUDE.md del proyecto para entender la arquitectura
- Implementa SOLO lo que pide la spec
- Usa `pnpm format` antes de terminar
- NO uses TodoWrite
- Respeta la arquitectura hexagonal: domain → application → infrastructure → presentation
- Usa path aliases (@/) para imports
- Valida input solo en boundaries (controllers, handlers). Confia en el dominio internamente
- NO agregues comments, docstrings o type annotations a codigo que no cambiaste
- Al terminar, output: <done/>

## DEV Fix Rules
- Aplica SOLO los fixes listados
- Usa `pnpm format` antes de terminar
- NO uses TodoWrite
- Al terminar, output: <done/>

## Review Rules
- Verifica que los cambios cumplen la spec
- Busca bugs, vulnerabilidades, codigo muerto
- Verifica arquitectura hexagonal: no imports de infrastructure en domain
- Verifica que no hay SQL injection, command injection, o XSS
- Verifica que los tipos de Drizzle/TypeScript son correctos
- Verifica que no hay N+1 queries
- NO sugieras mejoras cosmeticas, solo problemas reales

## Format Command
pnpm format

## Skills
(none)

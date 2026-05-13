---
satisfies: [R7, R8]
---

## Description

Aplicar codemods de bajo riesgo y reemplazos mecánicos: React 19 deprecated APIs (×9), Tailwind shorthand `size-N`/`p-N` (16 sitios), strings de design (em-dash ×4, three-period-ellipsis ×1, vague-button-label ×1). Todos verificables visualmente y con tests automatizados.

**Size:** M
**Files:**
- Múltiples (codemods tocan ~30-50 archivos). Excluir `src/features/campaigns/configuration/**` (fn-18 overlap).
- Tailwind: 12 sitios `redundant-size-axes`, 4 sitios `redundant-padding-axes` (lista exacta en `/tmp/rd-verbose.txt`).
- Design strings: `src/routes/ds.tsx:254,620,623`, `src/features/chat/components/mobile/MobileSystemCards.tsx:283`, `src/features/identity/auth/components/CallbackScreen.tsx:115`, `src/shared/ui/form/fields/TextField.test.tsx:36`.

## Approach

**React 19 codemods (cherry-pick)**:
- `npx codemod@latest react/19/remove-forward-ref --target src` (forwardRef ya no necesario, ref es prop).
- `npx codemod@latest react/19/replace-use-form-state --target src` (useFormState → useActionState).
- `npx codemod@latest react/19/replace-context-provider --target src` (`<Ctx.Provider>` → `<Ctx>`).
- Revisar listado de los 9 sitios en `/tmp/rd-verbose.txt` para confirmar qué API específica. Si hay otra (e.g., `useFormStatus` movido a `react-dom`), aplicar codemod específico o fix manual.
- Verificar que ningún codemod toque `src/features/campaigns/configuration/**`; si lo hace, revertir esos archivos antes de commit (fn-18 overlap).

**Tailwind shorthand (regex/sed)**:
- `w-N h-N` (mismo N) → `size-N`. Comando: `rg -l 'className="[^"]*\bw-(\d+)\s+h-\1\b'` luego `sed` puntual. Verificar cada match (a veces los axes son intencionales si uno cambia en breakpoint).
- `px-N py-N` (mismo N) → `p-N`. Mismo approach.
- Listado exacto de los 12 + 4 sitios en `/tmp/rd-verbose.txt`.

**Design strings**:
- Em-dash `—` (U+2014) en JSX text → comma/colon según contexto. NO reemplazar en strings de copy real (revisar caso por caso).
- `...` → `…` (U+2026) en JSX text.
- Vague button label "submit" en `TextField.test.tsx:36` — renombrar a algo descriptivo en el test.

## Investigation targets

**Required**:
- `/tmp/rd-verbose.txt` (listado exacto de los 9 react19-deprecated-apis, 12 size-axes, 4 padding-axes, 4 em-dash)
- Codemods oficiales: https://react.dev/reference/react/forwardRef, https://react.dev/blog/2024/12/05/react-19

**Optional**:
- https://tailwindcss.com/docs/size

## Design context

Relevantes DESIGN-DEV.md (en `marz-docs/`):
- **Spacing**: tokens spacing-N. Las utilities `p-N`/`size-N` mapean a esos tokens.
- **Typography**: las strings de design (em-dash, ellipsis) son decisiones tipográficas — el em-dash en JSX text se evita porque "lee como output de modelo".

## Acceptance

- [ ] `react-doctor` reporta 0 `no-react19-deprecated-apis`.
- [ ] `react-doctor` reporta 0 `design-no-redundant-size-axes` y 0 `design-no-redundant-padding-axes`.
- [ ] `react-doctor` reporta 0 `design-no-em-dash-in-jsx-text`, 0 `design-no-three-period-ellipsis`, 0 `design-no-vague-button-label`.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] Snapshot visual: pantallas afectadas (especialmente onboarding, chat mobile, ds.tsx) renderizan visualmente idénticas — verificar manualmente o con Playwright screenshots.
- [ ] Ningún archivo bajo `src/features/campaigns/configuration/**` modificado en este commit.

## Done summary
Codemods React 19, Tailwind shorthand y design strings aplicados correctamente sin regresiones ni alarmas funcionales.
## Evidence
- Commits:
- Tests:
- PRs:
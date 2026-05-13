---
satisfies: [R8, R11]
---

## Description

Tres categorías de finishing touches:
1. **A11y**: `role-has-required-aria-props` queda hecho en task 2, pero quedan `no-autofocus` (1) y `anchor-is-valid` (1).
2. **Handlers + design strings**: `no-generic-handler-names` ×9, `bold-heading` ×49, `no-prevent-default` ×16, `no-array-index-as-key` ×18, `no-giant-component` ×7.

**Size:** L → en realidad es M por la naturaleza repetitiva de los cambios (renames + un solo split de giant component si tiene tiempo).

**Files:**
- A11y: `src/features/identity/onboarding/brand/screens/B11AttributionScreen.tsx:140`, `src/features/campaigns/detail/CampaignDetailPage.test.tsx:24`.
- `no-array-index-as-key` ×18: 18 sitios, ejemplo `src/features/earnings/components/EarningsPage.tsx:126`.
- `no-prevent-default` ×16: detectar dónde — buscar `event.preventDefault()` redundante.
- `no-generic-handler-names` ×9: ejemplo `src/features/campaigns/brief-builder/components/PDFUploadField.tsx:76` (`handleChange` → nombre descriptivo).
- `design-no-bold-heading` ×49: lista en `/tmp/rd-verbose.txt` (ejemplo `src/routes/ds-onboarding.tsx:49`). Excluir si toca `configuration/**`.
- `no-giant-component` ×7: `src/features/deliverables/components/RequestChangesModal.tsx:62` (320 líneas), `src/features/chat/components/MessageTimeline.tsx:67`, `src/routes/ds.tsx:592`, `src/features/offers/components/BundleEditor.tsx:81`, `src/features/campaigns/configuration/BonusStep.tsx:161` (EXCLUIR), `src/features/campaigns/brief-builder/screens/P3Review.tsx:240`, `src/features/identity/onboarding/creator/components/ChannelEditor.tsx:101`.

## Approach

**A11y**:
- `B11AttributionScreen.tsx:140`: remover `autoFocus` o reemplazar con focus management vía useEffect+ref con justificación.
- `CampaignDetailPage.test.tsx:24`: agregar `href` al `<a>` o cambiar a `<button>` si es trigger.

**Array index as key**: para cada uno de los 18 sitios, identificar un id estable en el item. Si no existe id natural, agregar `id` al schema o generar `crypto.randomUUID()` cuando se construye la lista (no en render).

**prevent-default**: revisar cada uno — eliminar si es redundante (e.g., `onClick` no necesita `preventDefault` salvo que el elemento sea `<a>` o `<form>`). NO eliminar a ciegas en submit handlers.

**Generic handler names**: renombrar a verbos del dominio. `handleChange` → `setFileFromInput`, `handleClick` → `submitDraft`, etc. Mantener exporte si es consumido externamente.

**bold-heading ×49**: regla acordada — reemplazar `font-bold` por `font-semibold` en headings (`<h1>`..`<h6>` o elementos con role heading). Pitfall: revisar que no haya un contexto donde `font-bold` sea decisión de diseño (e.g., display headings de marketing). Verificar contra `marz-docs/DESIGN-DEV.md`.

**giant-component split**: solo split los componentes claramente sobrecargados. Heurística: extraer secciones JSX a subcomponentes en mismo archivo (`function Header()`, `function Body()`) o archivos hermanos. NO refactor agresivo. Si un giant component está en `configuration/`, omitir (fn-18). Excluir `BonusStep.tsx:161`. Si el split de uno es muy invasivo (>200 líneas movidas), diferirlo a fast-follow.

## Investigation targets

**Required**:
- `/tmp/rd-verbose.txt` (lista exacta de los 16 prevent-default, 9 generic-handlers, 49 bold-heading, 18 array-index)
- `marz-docs/DESIGN-DEV.md` (verificar política de font-weight en headings)
- Los 6 giant components no-configuration (340+ líneas en RequestChangesModal, etc.)

**Optional**:
- WCAG 2.2 autofocus guidelines

## Design context

- **Tipografía**: política asumida `font-semibold` (600) para headings vs `font-bold` (700) que crushea letterforms. Confirmar con Design o tomarlo de DESIGN-DEV.md.
- **Componentes**: regla "redondeado siempre" del CLAUDE.md de marzv2 — al split de giant components, mantener border-radius generosos.

## Acceptance

- [ ] `react-doctor` reporta 0 en: `no-autofocus`, `anchor-is-valid`, `no-array-index-as-key`, `no-prevent-default`, `no-generic-handler-names`, `design-no-bold-heading`, `no-giant-component` (excluyendo `configuration/`).
- [ ] Headings usan `font-semibold` consistentemente. Verificar visualmente vs design tokens en `styles.css`.
- [ ] Giant components split: cada uno bajo 200 líneas o documentar por qué no se split (e.g., wizard que necesita context compartido).
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] Regresión visual: pantallas con muchas headings (ds.tsx, onboarding, dashboards) renderizan visualmente correctas tras el cambio de bold → semibold.

## Done summary
Todos los issues del round anterior resueltos: count tipado como 1|2|3|4, RequestChangesModal dividido en 5 archivos con main ≤200l, MessageTimeline dividido en renderers+chrome, ds.tsx documentado como fast-follow con justificación en el task spec
## Evidence
- Commits:
- Tests:
- PRs:
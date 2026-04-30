---
satisfies: [R1, R9]
---

## Description

Componente `OfferTypeChooser` (Pencil `lkDOH`): tres tarjetas controladas (Single/Bundle/Multi-stage) emitiendo `onChange(type)`. Integracion en `SendOfferSidesheet` (FEAT-005): wrap arriba del editor; si el usuario cambia de tipo con datos cargados, mostrar modal de confirmacion (copy del spec edge case); al confirmar, resetear el form y cambiar `offerType` en Zustand. Al cancelar, mantener tipo previo.

**Size:** M
**Files:**

- `src/features/offers/components/OfferTypeChooser.tsx` (nuevo)
- `src/features/offers/components/OfferTypeChooser.test.tsx` (nuevo)
- `src/features/offers/components/SendOfferSidesheet.tsx` (modificar)
- `src/features/offers/components/SendOfferSidesheet.test.tsx` (modificar)
- `src/features/offers/store/sendOfferSheetStore.ts` (extender con `offerType` + `setOfferType`)

## Approach

- Refactor mecanico: extraer el formulario actual de `SendOfferSidesheet` a `SingleEditor.tsx` para que el sidesheet quede "shell + chooser + render(editor)".
- Reusar `Dialog` o `AlertDialog` de shadcn para la confirmacion.
- A11y: `role="radiogroup"` en el chooser, cada tarjeta `role="radio"` + `aria-checked`. ESC cierra el modal de confirmacion.
- Zustand: agregar `offerType: 'single' | 'bundle' | 'multistage' | null` y `setOfferType(type)` que maneja la confirmacion antes de mutar el state.

## Investigation targets

**Required:**

- `src/features/offers/components/SendOfferSidesheet.tsx` — punto de extension
- `src/features/offers/store/sendOfferSheetStore.ts` — store actual de FEAT-005
- `src/components/ui/dialog.tsx` o `alert-dialog.tsx` — primitive para confirmacion
- `src/features/identity/components/BrandShell.tsx` — patron del sidesheet trigger (si aplica)

**Optional:**

- Pencil `lkDOH` (chooser) — referencia visual
- `marz-design/Marz Redesign Standalone.html` — tokens y radios

## Design context

Relevante DESIGN.md / tokens:

- Tarjetas redondeadas (`rounded-lg` o `rounded-xl`), nunca cuadradas (regla del repo).
- Estado `selected` con border en `--primary`; hover suave en `--accent`.
- Tipografia: `text-base` para titulo de tarjeta, `text-sm text-muted-foreground` para descripcion.
- Confirmacion modal con copy: "Cambiar el tipo de oferta descartará los datos cargados. ¿Continuar?".

## Acceptance

- [ ] `OfferTypeChooser` renderiza tres opciones, controlled por `value`/`onChange`.
- [ ] Click en una tarjeta sin datos cambia tipo inmediato (sin modal).
- [ ] Click con datos cargados abre modal de confirmacion; cancel mantiene tipo previo, confirm resetea form.
- [ ] Tests unit: `rendersThreeOptions`, `confirmationOnTypeChangeWithData` (cancel no dispara onChange), `resetsFormOnTypeChangeConfirmed` en sidesheet.
- [ ] A11y: `role="radiogroup"` con `aria-label`, cada radio `aria-checked`, navegable con flechas.
- [ ] Validacion visual Pencil ≥95% contra `lkDOH`.
- [ ] Store Zustand expone `offerType` y `setOfferType` con la logica de confirmacion encapsulada.

## Done summary

key={offerType} en SingleEditor garantiza remount completo al cambiar tipo, resolviendo el reset del form. La máquina de estados del store es correcta y con guardas adecuados. OfferTypeChooser usa semántica HTML nativa accesible. Tests cubren los tres escenarios del flujo de confirmación.

## Evidence

- Commits:
- Tests:
- PRs:

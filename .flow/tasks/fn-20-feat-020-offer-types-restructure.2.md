---
satisfies: [R2, R3]
---

## Description

Crear el store Zustand `sendOfferWizardStore` y los schemas Zod del wizard. Es la base shared que consume F.3.

**Size:** S
**Files:**
- `src/features/offers/store/sendOfferWizardStore.ts`
- `src/features/offers/schemas/createOffer.ts`
- Tests adyacentes (`.test.ts`).

## Approach

Store (Zustand, in-memory, no persistido):

```ts
type SendOfferWizardState = {
  mode: 'same_content' | 'per_platform';
  sameContent: Partial<CreateOfferRequest>;
  perPlatform: Partial<CreateOfferRequest>;
  bonusesEnabledGlobal: boolean;
  bonusesSnapshot: BonusTerms | null;
};
```

Acciones: `setMode`, `patchSameContent`, `patchPerPlatform`, `setBonusesEnabledGlobal`, `setBonusesSnapshot`, `reset`. Al togglear `mode`, NO se pierde el snapshot del modo anterior — se preserva en su slot.

Schema Zod alineado a `CreateOfferRequest` v3:
- `campaign_id`, `creator_account_id`: uuid.
- `offer_mode`: `z.enum(['same_content','per_platform'])`.
- `amount`: `z.number().positive()`.
- `tentative_publish_date`: `YYYY-MM-DD`, `refine` ≥ `today+4d` (UTC).
- `offer_deadline`: `YYYY-MM-DD`, `refine` ≥ `tentative_publish_date`.
- `platforms`: array no vacío, sin duplicados, subset de `['instagram','tiktok','youtube']`.
- `bonus_terms` (opcional): discriminated union de `BonusAmount` (`percentage` 1..100 entero, `fixed` `amount_usd > 0`). Si `enabled=true`, `speed_bonus_windows.length >= 1`. `window_hours` 1..720.
- Cross-validation: `offer_mode === 'per_platform'` ⇒ `bonus_terms.enabled === false` y `speed_bonus_windows === []`.

## Investigation targets

**Required:**
- `src/shared/api/generated/` — tomar los tipos `CreateOfferRequest`, `BonusAmount`, `BonusTerms` directo del generated, no redeclarar.
- Buscar otro store Zustand del repo para seguir convención (`src/features/**/store/*.ts`).

**Optional:**
- `src/features/offers/schemas/*` existentes — patrón de validación previo (probablemente borrar/reemplazar tras F.3).

## Acceptance

- [ ] Store exporta hook `useSendOfferWizard()` con tipos completos.
- [ ] Test: toggle `setMode` preserva snapshots de ambos slots.
- [ ] Test: `reset()` limpia todo a estado inicial.
- [ ] Schema Zod: piso de `tentative_publish_date` se calcula en UTC (NO usar `new Date()` en JSX; ok en validators de Zod).
- [ ] Schema Zod: test de discriminated union `percentage` vs `fixed` (boundary 100, 0, negativos).
- [ ] Schema Zod: test cross-field `per_platform` + `bonus_terms.enabled=true` → error.
- [ ] `pnpm tsc --noEmit` verde.

## Done summary
Schema y store alineados al contrato generado. Todos los acceptance criteria cubiertos, typecheck y tests verdes.
## Evidence
- Commits:
- Tests:
- PRs:
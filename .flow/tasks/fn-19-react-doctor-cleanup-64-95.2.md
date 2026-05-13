---
satisfies: [R2]
---

## Description

Eliminar los errores hard restantes tras whitelistar falsos positivos: `effect-needs-cleanup` ×2, `no-mutable-in-deps` ×1, `role-has-required-aria-props` ×2. Son bugs reales con potencial de regresión runtime.

**Size:** S
**Files:**
- `src/features/campaigns/brief-builder/hooks/useBriefBuilderWS.ts:154` (effect-needs-cleanup) — verificar si está fuera del scope de fn-18 (brief-builder, distinto del configuration wizard)
- `src/shared/ws/useWebSocket.ts` (effect-needs-cleanup — revisar si es falso positivo dado que ya hay cleanup en línea 140-150)
- `src/features/identity/onboarding/components/MobileRedirectGuard.tsx:23` (no-mutable-in-deps)
- `src/features/identity/onboarding/creator/screens/C12GenderScreen.tsx:44` (role-has-required-aria-props ×2)

## Approach

- **effect-needs-cleanup `useBriefBuilderWS.ts:154`**: el effect que llama `subscribe(...)` debe retornar la función de unsubscribe (o llamar al hub.unsubscribe matching). Patrón: `useEffect(() => { const unsub = ws.subscribe(...); return unsub; }, [deps])`.
- **effect-needs-cleanup `useWebSocket.ts`**: confirmar si es duplicado falso positivo (el effect principal ya retorna cleanup en línea 140-150). Si es otro effect distinto, aplicar el mismo patrón.
- **no-mutable-in-deps `MobileRedirectGuard.tsx:23`**: leer `location.pathname` DENTRO del effect body, no en deps array. Mutables globales (`location.*`, `ref.current`) no disparan re-runs aunque cambien.
- **role-has-required-aria-props `C12GenderScreen.tsx:44`**: elementos con `role="radio"` necesitan `aria-checked={boolean}`. Agregarlo a cada opción.

## Investigation targets

**Required**:
- `src/features/campaigns/brief-builder/hooks/useBriefBuilderWS.ts:140-170`
- `src/shared/ws/useWebSocket.ts:50-160` (entender ambos effects)
- `src/features/identity/onboarding/components/MobileRedirectGuard.tsx:1-50`
- `src/features/identity/onboarding/creator/screens/C12GenderScreen.tsx:30-80`

## Acceptance

- [ ] `react-doctor` reporta 0 errors (excluyendo los 2 whitelisted en task 1).
- [ ] `useBriefBuilderWS.ts:154` retorna cleanup function que llama al unsubscribe del hub WS.
- [ ] `MobileRedirectGuard.tsx` lee `location.pathname` dentro del effect, no en deps.
- [ ] `C12GenderScreen.tsx` cada radio option tiene `aria-checked` con boolean correcto.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- [ ] Test manual: onboarding creator C12 gender screen funciona como antes (no regresión funcional).

## Done summary
Cinco fixes de spec implementados correctamente: cleanup de effect en useBriefBuilderWS retorna unsubscribe, useWebSocket refactoreado con named handlers para permitir removeEventListener, MobileRedirectGuard lee pathname dentro del body del effect, C12GenderScreen agrega aria-checked, test nuevo cubre el cleanup. Sin bugs, sin dead code, sin any sin justificar.
## Evidence
- Commits:
- Tests:
- PRs:
# fn-1.13 F.10 — Layout /onboarding/brand + store Zustand + máquina de pasos


## Description

Layout `/onboarding/brand` + máquina de pasos + store Zustand con sessionStorage.

- Archivos:
  - `src/routes/onboarding/brand.tsx` — layout con `OnboardingShell` + `<Outlet />`.
  - `src/routes/onboarding/brand.$step.tsx` — renderiza la pantalla según `step` param.
  - `src/features/identity/onboarding/brand/store.ts` — Zustand con `sessionStorage`.
  - `src/features/identity/onboarding/brand/steps.ts` — orden + metadata de los 14 pasos.

### Store (SSR-safe — ver epic spec §D1)

```ts
const sessionStorageSSR = createJSONStorage(() =>
  typeof window === 'undefined'
    ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
    : sessionStorage
);

type BrandOnboardingState = Partial<BrandOnboardingPayload> & {
  currentStepIndex: number;
};
export const useBrandOnboardingStore = create<BrandOnboardingState>()(
  persist(
    (set, get) => ({
      currentStepIndex: 0,
      setField: (k, v) => set({ [k]: v } as Partial<BrandOnboardingState>),
      next: () => set(s => ({ currentStepIndex: Math.min(s.currentStepIndex + 1, STEPS.length - 1) })),
      back: () => set(s => ({ currentStepIndex: Math.max(s.currentStepIndex - 1, 0) })),
      reset: () => set({ currentStepIndex: 0 }),
    }),
    {
      name: 'marz-brand-onboarding',
      storage: sessionStorageSSR,
      skipHydration: true, // rehidratar manualmente client-side
    }
  )
);
```

En el layout (`src/routes/onboarding/brand.tsx`), montar un `useEffect` client-only que haga `useBrandOnboardingStore.persist.rehydrate()` una vez. Sin esto, el store arranca vacío tras F5 (no se lee sessionStorage).

### Steps
Array de objetos `{ id: 'identity'|'vertical'|...|'confirmation', component, validate?: (state) => boolean }`. El layout deriva el paso actual desde URL (`$step` param) con fallback a store. Next/Back usan el orden del array.

### Guard del layout
- Requiere session + `kind === 'brand'` + `onboarding_status === 'onboarding_pending'`.
- Otro estado → redirect a `redirect_to`.

## Acceptance

- [ ] Todas las 14 pantallas se pueden navegar con Back/Next (stub components iniciales, contenido real en F.11).
- [ ] Refresh (F5) preserva `currentStepIndex` y data ingresada (sessionStorage).
- [ ] Abrir en otra tab → arranca en paso 1 (sessionStorage es por tab).
- [ ] Clear sessionStorage → arranca en paso 1.
- [ ] Guard redirect funciona (test con `useMe` mockeado en distintos estados).
- [ ] URL refleja el paso (`/onboarding/brand/vertical`, etc.).
- [ ] Deep link directo a un paso no visitado muestra la pantalla pero con store vacío — se puede decidir en esta task si redirigir al primer paso pendiente o permitir; documentar decisión.
- [ ] **SSR**: `pnpm build && pnpm start` carga la ruta server-side sin crashear (no `ReferenceError: sessionStorage is not defined`). Verificado con test o inspección del output SSR (§D1).
- [ ] F5 en `/onboarding/brand/vertical` con data previa: tras hidratación el store tiene la data persistida (el `rehydrate()` client-side funciona).

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

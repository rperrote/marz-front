# fn-1.13 F.10 — Layout /onboarding/brand + store Zustand + máquina de pasos

## Description
Layout `/onboarding/brand` + máquina de pasos + store Zustand con sessionStorage.

- `src/routes/onboarding/brand.tsx` — layout con `OnboardingShell` + `<Outlet />`.
- `src/routes/onboarding/brand.$step.tsx` — renderiza la pantalla según `step` param.
- `src/features/identity/onboarding/brand/store.ts` — Zustand + sessionStorage SSR-safe.
- `src/features/identity/onboarding/brand/steps.ts` — orden + metadata de los 14 pasos.

### Store (SSR-safe)

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
      skipHydration: true,
    }
  )
);
```

En el layout montar un `useEffect` client-only que haga `useBrandOnboardingStore.persist.rehydrate()` una vez.

### Steps
Array `{ id, component, validate?: (state) => boolean }`. El layout deriva el paso actual desde URL (`$step` param). Next/Back usan el orden del array.

### Guard del layout
- Requiere session + `kind === 'brand'` + `onboarding_status === 'onboarding_pending'`.
- Otro estado → redirect a `redirect_to`.
## Acceptance
- [ ] Todas las 14 pantallas navegables con Back/Next.
- [ ] Refresh (F5) preserva `currentStepIndex` y data (sessionStorage).
- [ ] Abrir en otra tab → arranca en paso 1 (sessionStorage es por tab).
- [ ] Guard redirect funciona.
- [ ] URL refleja el paso (`/onboarding/brand/vertical`, etc.).
- [ ] Deep link directo a un paso no visitado: documentar decisión (redirigir al primero o permitir).
- [ ] SSR: `pnpm build && pnpm start` no crashea (no `ReferenceError: sessionStorage is not defined`).
- [ ] F5 con data previa: tras `rehydrate()` el store tiene la data persistida.
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

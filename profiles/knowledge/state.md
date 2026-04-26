# state

Server state vs client state. Cargar cuando agregues estado nuevo, refactores Zustand stores, o tengas dudas sobre dónde vive un dato.

## Server-first

**Servidor primero**: cualquier dato que vive en el backend → React Query (hooks Orval). NO copiarlo a Zustand. NO duplicar en client state.

Server state incluye:

- Listas de campañas, ofertas, deliverables, mensajes.
- Datos de cuenta, workspaces, perfil.
- Configuración del producto.

Pasa por hooks generados (`useMe()`, `useGetCampaigns()`, etc.). React Query maneja cache, refetch, optimistic updates.

## Client state

Solo cuando es **genuinamente efímero**:

- UI toggles (modal abierto, dropdown expandido, theme override).
- Selección no persistida (item highlighted en una lista).
- Drafts antes de submitear (formulario, onboarding multi-step).

Opciones, en orden de preferencia:

1. **`useState`** — local al componente. Default.
2. **Zustand store** — cuando hay que compartir entre componentes que no son padre/hijo, o persistir.
3. **Context** — solo cuando el state es muy local a un subtree (theme provider, form provider).

## Zustand stores

Vienen en `features/<bc>/store.ts`. Convención:

```ts
export const useBrandOnboardingStore = create<BrandOnboardingState>()(
  persist(
    (set) => ({
      currentStepIndex: 0,
      setField: (key, value) => set({ [key]: value }),
      reset: () =>
        set({
          /* defaults */
        }),
    }),
    {
      name: 'marz-brand-onboarding',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
)
```

Notas críticas:

- **`skipHydration: true`** + `useEffect(() => store.persist.rehydrate(), [])` en el layout para evitar hidration mismatch en SSR.
- **Sessionstorage** para drafts (ej. onboarding). **localStorage** para preferencias persistentes (theme).
- **Reset** explícito en logout / submit exitoso.

## Selectores

```ts
const store = useStore() // suscribe a TODO el state. OK si usás varios fields.
const name = useStore((s) => s.name) // suscribe solo a `name`. Mejor performance si el componente re-renderiza mucho.
```

Usar selector cuando el componente no usa más de 1-2 fields del store y re-renders importan.

## Rules of Hooks con stores

`useStore()` (Zustand) sigue Rules of Hooks. **Llamarlo antes de cualquier `return null` condicional.** Si está después, queda una suscripción "dormida" y el componente no re-renderiza al cambiar el store.

## Reset

Stores con persist necesitan reset explícito:

```ts
reset: () => {
  set({
    /* defaults */
  })
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}
```

`set({ defaults })` solo no limpia sessionStorage. Hay que removerlo a mano.

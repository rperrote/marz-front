# donts

Antipatterns específicos del repo. Cargar cuando estés por hacer algo que parece raro o atajos tentadores.

## NO editar generated code

`src/shared/api/generated/` y `routeTree.gen.ts` son generados. Editarlos rompe el siguiente regen.

- API contract → cambiar en backend → `pnpm api:sync`.
- Routes → editar archivos en `src/routes/`.

## NO escribir CLAUDE.md, READMEs, planning docs

A menos que el usuario lo pida explícitamente. Trabajar desde el contexto de la conversación, no crear archivos `.md` nuevos.

## NO editar shadcn primitives

`src/components/ui/*` son regenerables. Si necesitás variante:

```
src/components/ui/Button.tsx          ← NO editar
src/shared/ui/PrimaryButton.tsx       ← Wrapper acá
```

## NO duplicar server state en client state

```ts
// MAL
const meQuery = useMe()
const [me, setMe] = useState(meQuery.data)
useEffect(() => setMe(meQuery.data), [meQuery.data])

// BIEN
const meQuery = useMe()
const me = meQuery.data
```

## NO `any`, NO `as` sin razón

```ts
// MAL
const data = response.data as Account

// BIEN
if (response.status === 200) {
  const data = response.data // ya tipado
}
```

## NO dependencias entre BCs

```ts
// MAL: features/offers/ importa de features/chat/
import { ChatBubble } from '#/features/chat/components/ChatBubble'

// BIEN: si lo necesitan los dos, mover a shared/
import { ChatBubble } from '#/shared/ui/ChatBubble'
```

## NO push, force, reset destructivo sin consentimiento explícito

Repo git de `marz-front` es real. Las acciones destructivas requieren OK explícito del usuario. NUNCA `git push --force`, `git reset --hard`, `git checkout .` sin pedir.

## NO bypassear checks

```bash
# MAL
git commit --no-verify

# MAL en código
// eslint-disable-next-line
// @ts-ignore
```

Si lint o typecheck falla, fixear la causa. Si hay un caso legítimo, dejar comentario explicando por qué.

## NO usar `react-hook-form`

Stack es **TanStack Form**. No agregar otra lib de forms. No portar patterns de `react-hook-form` a TanStack Form sin entender el modelo.

## NO `npm` o `yarn`

`pnpm` está pineado en `packageManager`. Usar otra cosa rompe lockfile y peer deps.

## NO mock'ear Lingui sin macro check

```ts
vi.mock('@lingui/core/macro', () => ({
  t: Object.assign(/* ... */, { __lingui: true }),
}))
```

Sin `__lingui: true` el helper de Lingui falla. Copiar el patrón de tests existentes.

## NO hardcodear copy en JSX

Todo string user-facing pasa por `t\`\``o`<Trans>`. Hardcodear strings rompe i18n.

## NO `useEffect` para data fetching

Para data del server, usar React Query (hooks Orval). `useEffect` con `fetch` es el antipattern más común.

```ts
// MAL
useEffect(() => {
  fetch('/api/me').then(setMe)
}, [])

// BIEN
const meQuery = useMe()
```

## NO navegar con `window.location`

```ts
// MAL
window.location.href = '/campaigns'

// BIEN
const navigate = useNavigate()
navigate({ to: '/campaigns' })
```

## NO `style={{ ... }}` para spacing/colors

Usar utilities de Tailwind. `style` solo para valores dinámicos que no se pueden expresar como class (ej. `style={{ backgroundColor: dynamicColor }}` con color que viene de runtime).

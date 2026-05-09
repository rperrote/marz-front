---
satisfies: [R3, R4]
---

## Description

Definir la configuración tipada de navegación del shell para `kind='brand'` y `kind='creator'`, junto con el resolver de item activo. Es trabajo de **datos puros + tipos**, sin UI ni rutas. Habilita que F.2 (sidebar) y F.4 (composición) consuman una única fuente de verdad.

**Size:** S
**Files:**

- `src/features/identity/app-shell/navigation.ts` (nuevo)
- `src/features/identity/app-shell/navigation.test.ts` (nuevo)

## Approach

- Definir tipos: `ShellNavigationItem { id, label, icon, href?, disabled, disabledReason? }`, `ShellNavigationConfig { brand: Item[], creator: Item[] }`.
- Items habilitados MVP: `workspace` (icon `message-square`), `inbox`. Resto disabled con `disabledReason: 'Próximamente'`.
- Brand items orden exacto: `home, workspace, inbox, campaigns, creators, analytics`.
- Creator items orden exacto: `home, workspace, inbox, analytics`.
- Exportar `resolveActiveSidebarItem(items, pathname): ShellNavigationItem | null`. Matching: prefix-match estricto sobre `href`, devolviendo el item con match más largo. Si ningún item habilitado matchea, devolver `null`.
- No incluir hrefs en items disabled (o usar `href: undefined`) para que F.2 no pueda navegar accidentalmente.

## Investigation targets

**Required:**

- `src/features/identity/components/SidebarItem.tsx` — referencia de items legacy.
- `src/routes/_brand.tsx`, `src/routes/_creator.tsx` — rutas y `accountKind`.
- `src/routes/workspace.tsx` — confirmar path `/workspace`.

**Optional:**

- `lucide-react` — nombres exactos de iconos a usar.

## Key context

- Q12.6: shell no emite analytics. La config no debe incluir hooks de tracking.
- Si más adelante se quiere mostrar `Inicio` como home, será otra feature; aquí queda disabled.

## Acceptance

- [ ] Unit test: brand items exactos en orden `home, workspace, inbox, campaigns, creators, analytics`; habilitados solo `workspace`, `inbox`.
- [ ] Unit test: creator items exactos en orden `home, workspace, inbox, analytics`; habilitados solo `workspace`, `inbox`.
- [ ] Unit test: el ítem `workspace` usa icon `message-square`.
- [ ] Unit test: items disabled tienen `href` ausente o son no-navegables por contrato.
- [ ] Unit test: `resolveActiveSidebarItem(brandItems, '/workspace')` devuelve el item `workspace`.
- [ ] Unit test: `resolveActiveSidebarItem(brandItems, '/inbox')` devuelve el item `inbox`.
- [ ] Unit test: `resolveActiveSidebarItem(brandItems, '/campaigns/new')` devuelve `null` (campaigns está disabled).
- [ ] Unit test: `resolveActiveSidebarItem(creatorItems, '/auth')` devuelve `null`.
- [ ] `pnpm typecheck` y `pnpm test` pasan.

## Done summary
navigation.ts y navigation.test.ts implementan la spec F.1 correctamente: tipos, orden de items, habilitados MVP, resolveActiveSidebarItem con prefix-match estricto. Todos los acceptance criteria cubiertos. El fix colateral en P1Input.test.tsx es válido. 130 tests pasan, typecheck limpio.
## Evidence
- Commits:
- Tests:
- PRs:
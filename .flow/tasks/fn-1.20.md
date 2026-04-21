# fn-1.20 F.17 — Detección mobile + /desktop-only


## Description

Detección mobile + ruta `/desktop-only`.

**Decisión** (epic spec §D7): detección **client-only** con default `false` en SSR. Se acepta flicker de 1 frame en mobile real. No UA parsing server-side.

- Hook `src/features/identity/onboarding/hooks/useIsMobile.ts`:
  ```ts
  export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState(false); // SSR-safe default
    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 1024);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
  };
  ```
- Layout raíz o wrapper de rutas de la feature:
  - El redirect a `/desktop-only` se dispara en `useEffect` — **no** durante render SSR (para evitar hydration mismatch).
  - Si `isMobile` Y la ruta activa es `/auth/*` o `/onboarding/*` (no `/desktop-only`): navigate a `/desktop-only`.
  - Si `isMobile` Y la ruta activa es `/_brand/*` o `/_creator/*`: **permitir** (features futuras pueden soportar mobile).
- Ruta `src/routes/desktop-only.tsx`:
  - Copy: "Marz todavía no está optimizado para mobile. Abrí Marz desde tu computadora para completar el onboarding."
  - Botón "Refrescar" (por si el user cambió ventana).
  - Si detecta que ahora es desktop: auto-redirect al último path intentado (guardar en sessionStorage al disparar el redirect).

## Acceptance

- [ ] Ventana 320px de ancho en ruta `/auth` → redirect a `/desktop-only`.
- [ ] Ventana 320px en `/_brand/campaigns` → NO redirect (no bloqueamos shells).
- [ ] Resize de 320 a 1280 en `/desktop-only` → navega al path original.
- [ ] Deep link directo a `/desktop-only` funciona.
- [ ] SSR: no `ReferenceError: window is not defined` — verificado con `pnpm build && pnpm start` accediendo a `/auth` (§D7).
- [ ] SSR render + hydration en desktop: sin warning de hydration mismatch en consola.
- [ ] Mobile real: flicker de `/auth` visible por <100ms antes del redirect — **aceptado** (§D7); documentado en `Done summary`.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:

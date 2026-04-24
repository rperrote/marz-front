# fn-1.17 F.14 — 20 pantallas onboarding creator (C1-C20)

## Description

Implementar las 20 pantallas del onboarding creator (C1-C20). La task más grande del epic.

Ubicación: `src/features/identity/onboarding/creator/screens/`.

| #           | Screen                   | Notas clave                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1          | `C1NameHandleScreen`     | Inputs `display_name` + `handle`. Validación de formato handle (`^[a-z0-9_]{3,30}$`). Preview "marz.co/@handle". Debounce opcional para check-handle-available (solo validar en submit final).                                                                                                                                                                                                                                                                                                            |
| C2          | `C2ExperienceScreen`     | 4 `OnboardingOptionChip` → `experience_level`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C3          | `C3PrimingBrandsWaiting` | Sin input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C4          | `C4TierScreen`           | 6 `OnboardingTierCard` (emergent/growing/consolidated/reference/massive/celebrity).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| C5          | `C5NichesScreen`         | Grid ~15 `OnboardingOptionChip`, multi-select 1-5, contador visible.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| C6          | `C6ContentTypesScreen`   | 12 `OnboardingContentTypeChip`, multi-select min 1.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| C7          | `C7ChannelsScreen`       | **El más complejo.** Subcomponente `ChannelEditor` en `components/ChannelEditor.tsx`. Add/remove canales (platform dropdown + handle + `is_primary` radio + subgrupo rate_cards por format). Exactamente uno con `is_primary=true` (radio group). Formatos permitidos por platform: IG → `ig_reel`, `ig_story`, `ig_post`; TikTok → `tiktok_post`; YouTube → `yt_short`, `yt_long`, `yt_podcast`. Money con 2 decimales + currency (default USD). **Validaciones** via schema Zod compartido `schema.ts`. |
| C8, C8b, C9 | primings                 | Sin input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C10         | `C10BestVideosScreen`    | **Exactamente 3 slots fijos**. Cada slot: input URL + toggle `organic`/`branded`. Ningún slot puede quedar vacío.                                                                                                                                                                                                                                                                                                                                                                                         |
| C11         | `C11BirthdayScreen`      | Date picker nativo o custom; ISO `YYYY-MM-DD`.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| C12         | `C12GenderScreen`        | 4 chips + botón "Skip" (opcional, nullable).                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| C13         | `C13LocationScreen`      | Country select (ISO 3166-1 alpha-2) + input city.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| C14         | `C14PrimingNumbers`      | Sin input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C15         | `C15WhatsappScreen`      | Input E.164.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| C16         | `C16ReferralScreen`      | Input opcional + "Skip".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| C17         | `C17AvatarScreen`        | Upload via `usePresignAvatar` → PUT al `upload_url` devuelto → guarda `avatar_s3_key` en store. **Nunca hardcodear el host** — leer siempre del response. Preview circular. Client-side: max 5MB, image/\*.                                                                                                                                                                                                                                                                                               |
| C18, C19    | primings                 | Sin input.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| C20         | `C20ConfirmationScreen`  | Botón "Empezar" → fn-1.18.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Reglas:

- Todas usan shell components de fn-1.7.
- Analytics por paso.
- Strings via Lingui.
- Validaciones locales estrictas.

**Schema Zod compartido** — crear `src/features/identity/onboarding/creator/schema.ts`:

```ts
import { CreatorOnboardingPayload as Generated } from '#/shared/api/generated';
import { z } from 'zod';

const FORMATS_BY_PLATFORM = {
  instagram: ['ig_reel', 'ig_story', 'ig_post'],
  tiktok: ['tiktok_post'],
  youtube: ['yt_short', 'yt_long', 'yt_podcast'],
} as const;

export const creatorChannelsRefinement = (channels: Generated['channels'], ctx: z.RefinementCtx) => {
  if (channels.length < 1) {
    ctx.addIssue({ code: 'custom', path: ['channels'], message: 'at_least_one_channel_required' });
    return;
  }
  const primaries = channels.filter(c => c.is_primary).length;
  if (primaries !== 1) {
    ctx.addIssue({ code: 'custom', path: ['channels'], message: 'exactly_one_primary_required' });
  }
  channels.forEach((channel, i) => {
    const allowed = FORMATS_BY_PLATFORM[channel.platform];
    const seenFormats = new Set<string>();
    channel.rate_cards.forEach((rc, j) => {
      if (!allowed.includes(rc.format)) {
        ctx.addIssue({ code: 'custom', path: ['channels', i, 'rate_cards', j, 'format'], message: 'format_not_valid_for_platform' });
      }
      if (seenFormats.has(rc.format)) {
        ctx.addIssue({ code: 'custom', path: ['channels', i, 'rate_cards', j, 'format'], message: 'duplicate_format_in_channel' });
      }
      seenFormats.add(rc.format);
    });
  });
};

export const CreatorOnboardingPayloadSchema = /* Orval-generated base schema */
  .superRefine((val, ctx) => {
    creatorChannelsRefinement(val.channels, ctx);
    if (val.best_videos.length !== 3) {
      ctx.addIssue({ code: 'custom', path: ['best_videos'], message: 'exactly_three_videos_required' });
    }
    if (val.niches.length < 1 || val.niches.length > 5) {
      ctx.addIssue({ code: 'custom', path: ['niches'], message: 'niches_count_out_of_range' });
    }
  });
```

**Este schema se importa desde**: C7 form (TanStack Form validator) y `fn-1.18` (submit final). Una sola fuente.

## Acceptance

- [ ] Las 20 pantallas existen.
- [ ] Happy path e2e creator: recorrer los 20 pasos → store con payload completo válido.
- [ ] C5 multi-select bloquea Next si count < 1 o > 5; contador visible.
- [ ] C7 ChannelEditor: agregar 3 canales, rate cards por cada uno; solo uno es primary; canal duplicado (misma plataforma) → documentar decisión en el código (backend valida `UNIQUE(creator, platform, format)` en rate_cards, no en channels).
- [ ] C10: menos de 3 URLs → Next disabled.
- [ ] C17 upload: archivo >5MB rechaza con mensaje; válido sube al `upload_url` del response y muestra preview. El host no está hardcodeado.
- [ ] `src/features/identity/onboarding/creator/schema.ts` exporta `CreatorOnboardingPayloadSchema` y es importado por C7 y por `fn-1.18`.
- [ ] Test: `schema.parse(payload)` con 2 canales primary → falla con issue en `channels`. Dos rate_cards con mismo format en un channel → falla con issue en `channels[i].rate_cards[j].format`.
- [ ] C12 y C16 "Skip" funciona (guardan null).
- [ ] Axe-core clean.
- [ ] Validación visual ≥95% contra pencil en pantallas clave (C1, C4, C5, C7, C10, C17).
- [ ] Lingui strings extraídas.

## Done summary

Todas las 11 correcciones del review anterior están verificadas: memory leak de blob URLs revocado correctamente, imports reordenados, radiogroups agregados en C10/C12/C2/C4, tracking de skip en C12/C16, comentario de decisión en ChannelEditor, validación Zod integrada en C7, y tests de C17 cubren los 4 casos requeridos. Tests (48), lint y typecheck pasan.

## Evidence

- Commits:
- Tests:
- PRs:

import { useCallback, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Input } from '#/components/ui/input'
import { FieldRow } from '#/shared/ui/form'
import { WizardSectionTitle } from '#/shared/ui/wizard'
import { useBrandOnboardingStore } from '../store'
// Brand enrichment fuera del MVP — se reactiva post-MVP.
// import { useEffect, useRef } from 'react'
// import { useBrandEnrichment } from '#/shared/api/generated/onboarding/onboarding'
// import type { BrandfetchSnapshot } from '#/shared/api/generated/model/brandfetchSnapshot'

export function B1IdentityScreen() {
  const store = useBrandOnboardingStore()
  const [urlInput, setUrlInput] = useState(store.website_url ?? '')

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      store.setField('name', e.target.value)
    },
    [store],
  )

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setUrlInput(val)
      store.setField('website_url', val || null)
      // Brand enrichment fuera del MVP: no debouncing porque no hay fetch.
      // if (timerRef.current) clearTimeout(timerRef.current)
      // timerRef.current = setTimeout(() => setDebouncedUrl(val), 500)
    },
    [store],
  )

  const handleUrlBlur = useCallback(() => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (/^https?:\/\//i.test(trimmed)) return
    const normalized = `https://${trimmed}`
    setUrlInput(normalized)
    store.setField('website_url', normalized)
  }, [urlInput, store])

  // Brand enrichment fuera del MVP — bloque completo deshabilitado.
  // const [debouncedUrl, setDebouncedUrl] = useState(urlInput)
  // const timerRef = useRef<ReturnType<typeof setTimeout>>(null)
  //
  // useEffect(() => {
  //   return () => {
  //     if (timerRef.current) clearTimeout(timerRef.current)
  //   }
  // }, [])
  //
  // const enrichmentEnabled =
  //   debouncedUrl.trim().length > 0 && debouncedUrl.includes('.')
  // const enrichment = useBrandEnrichment(
  //   { url: debouncedUrl },
  //   { query: { enabled: enrichmentEnabled } },
  // )
  //
  // const enrichmentData =
  //   enrichment.data &&
  //   'status' in enrichment.data &&
  //   enrichment.data.status === 200
  //     ? enrichment.data.data
  //     : null
  //
  // useEffect(() => {
  //   if (enrichmentData) {
  //     store.setField('primary_color_hex', enrichmentData.primary_color_hex)
  //     store.setField('secondary_color_hex', enrichmentData.secondary_color_hex)
  //     store.setField(
  //       'brandfetch_snapshot',
  //       enrichmentData.raw as BrandfetchSnapshot,
  //     )
  //   }
  // }, [enrichmentData, store])

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <WizardSectionTitle
        title={t`¿Cómo se llama tu marca?`}
        subtitle={t`Ingresá el nombre y la web de tu marca para comenzar.`}
      />
      <div className="flex w-full max-w-[440px] flex-col gap-6">
        <FieldRow label={t`Nombre de la marca`} error={store.fieldErrors.name}>
          {(aria) => (
            <Input
              {...aria}
              value={store.name ?? ''}
              onChange={handleNameChange}
              placeholder={t`Mi Marca`}
              maxLength={200}
            />
          )}
        </FieldRow>
        <FieldRow label={t`Sitio web`} error={store.fieldErrors.website_url}>
          {(aria) => (
            <Input
              {...aria}
              value={urlInput}
              onChange={handleUrlChange}
              onBlur={handleUrlBlur}
              placeholder={t`https://mimarca.com`}
              maxLength={500}
            />
          )}
        </FieldRow>
        {/* Brand enrichment preview fuera del MVP — se reactiva post-MVP.
        {enrichmentData && (
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            {enrichmentData.logo_url && (
              <img
                src={enrichmentData.logo_url}
                alt={t`Logo de la marca`}
                className="size-10 rounded-lg object-contain"
              />
            )}
            <div className="flex items-center gap-2">
              {enrichmentData.primary_color_hex && (
                <div
                  className="size-6 rounded-full border border-border"
                  style={{
                    backgroundColor: enrichmentData.primary_color_hex,
                  }}
                  aria-label={t`Color primario: ${enrichmentData.primary_color_hex}`}
                />
              )}
              {enrichmentData.secondary_color_hex && (
                <div
                  className="size-6 rounded-full border border-border"
                  style={{
                    backgroundColor: enrichmentData.secondary_color_hex,
                  }}
                  aria-label={t`Color secundario: ${enrichmentData.secondary_color_hex}`}
                />
              )}
            </div>
          </div>
        )} */}
      </div>
    </div>
  )
}

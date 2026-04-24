import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@lingui/core/macro'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { OnboardingSectionTitle } from '#/features/identity/onboarding/shared/components'
import { usePresignCreatorAvatar } from '#/shared/api/generated/onboarding/onboarding'
import type { AvatarPresignRequestContentType } from '#/shared/api/generated/model/avatarPresignRequestContentType'
import { useCreatorOnboardingStore } from '../store'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES: Record<string, AvatarPresignRequestContentType> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
}

export function C17AvatarScreen() {
  const store = useCreatorOnboardingStore()
  const presign = usePresignCreatorAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_BYTES) {
        toast.error(t`El archivo supera los 5MB permitidos.`)
        return
      }
      const contentType = ACCEPTED_TYPES[file.type]
      if (!contentType) {
        toast.error(t`Solo se permiten imágenes JPEG, PNG o WebP.`)
        return
      }

      setUploading(true)
      try {
        const res = await new Promise<
          Awaited<ReturnType<typeof presign.mutateAsync>>
        >((resolve, reject) => {
          presign.mutate(
            { data: { filename: file.name, content_type: contentType } },
            { onSuccess: resolve, onError: reject },
          )
        })

        if (res.status !== 200) {
          throw new Error('presign failed')
        }
        const result = res.data

        await fetch(result.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
            ...result.required_headers,
          },
          body: file,
        })

        store.setField('avatar_s3_key', result.s3_key)

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
        }
        const url = URL.createObjectURL(file)
        previewUrlRef.current = url
        setPreview(url)
      } catch {
        toast.error(t`Error al subir la imagen. Intentá de nuevo.`)
      } finally {
        setUploading(false)
      }
    },
    [presign, store],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void handleFile(file)
      e.target.value = ''
    },
    [handleFile],
  )

  const handleRemove = useCallback(() => {
    store.setField('avatar_s3_key', '')
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setPreview(null)
  }, [store])

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <OnboardingSectionTitle
        title={t`Tu foto de perfil`}
        subtitle={t`Subí una foto para que las marcas te reconozcan.`}
      />
      <div className="flex flex-col items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={t`Preview de avatar`}
              className="size-32 rounded-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon-xs"
              className="absolute -right-1 -top-1 rounded-full"
              onClick={handleRemove}
              aria-label={t`Eliminar foto`}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex size-32 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Upload className="size-6" />
            <span className="text-[length:var(--font-size-xs)]">
              {uploading ? t`Subiendo...` : t`Subir foto`}
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          aria-label={t`Seleccionar imagen`}
        />
        {store.fieldErrors.avatar_s3_key && (
          <p className="text-[length:var(--font-size-sm)] text-destructive">
            {store.fieldErrors.avatar_s3_key}
          </p>
        )}
        <p className="text-[length:var(--font-size-xs)] text-muted-foreground">
          {t`JPEG, PNG o WebP. Máximo 5MB.`}
        </p>
      </div>
    </div>
  )
}

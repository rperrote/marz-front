import { useRef, useState } from 'react'
import { FileUp, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { FieldRow } from '#/shared/ui/form'
import { cn } from '#/lib/utils'

const ACCEPTED_MIME = 'application/pdf'
const MAX_SIZE_BYTES = 10 * 1024 * 1024

interface PDFUploadFieldProps {
  file: File | null
  onFileChange: (file: File | null) => void
  label?: string
  hint?: string
}

function validatePdf(file: File): string | null {
  if (
    file.type !== ACCEPTED_MIME &&
    !file.name.toLowerCase().endsWith('.pdf')
  ) {
    return 'Solo se aceptan archivos PDF.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Archivo demasiado grande (>10MB).'
  }
  return null
}

export function PDFUploadField({
  file,
  onFileChange,
  label = 'Documento PDF',
  hint = 'Opcional. Subí un PDF con info de tu marca.',
}: PDFUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return

    const validationError = validatePdf(selected)
    if (validationError) {
      setError(validationError)
      onFileChange(null)
      event.target.value = ''
      return
    }

    setError(null)
    onFileChange(selected)
    event.target.value = ''
  }

  const handleRemove = () => {
    setError(null)
    onFileChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <FieldRow
      label={label}
      hint={!file && !error ? hint : undefined}
      error={error ?? undefined}
    >
      {(aria) => (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            id={aria.id}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={handleChange}
            aria-describedby={aria['aria-describedby']}
            aria-invalid={aria['aria-invalid']}
          />
          {file ? (
            <div
              className={cn(
                'flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2',
              )}
            >
              <span className="truncate text-sm text-foreground">
                {file.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={handleRemove}
                aria-label="Eliminar archivo"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="size-4" />
              Seleccionar archivo PDF
            </Button>
          )}
        </div>
      )}
    </FieldRow>
  )
}

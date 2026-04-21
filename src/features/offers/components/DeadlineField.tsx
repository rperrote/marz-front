import { Calendar } from 'lucide-react'

interface DeadlineFieldProps {
  value: string
  onChange?: (value: string) => void
  placeholder?: string
  id?: string
}

export function DeadlineField({
  value,
  onChange,
  placeholder = 'Pick a date',
  id,
}: DeadlineFieldProps) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border bg-background px-4 py-2.5">
      <Calendar className="size-4 shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="flex-1 border-0 bg-transparent text-sm text-foreground outline-none"
      />
    </div>
  )
}

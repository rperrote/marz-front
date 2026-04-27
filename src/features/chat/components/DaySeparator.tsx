interface DaySeparatorProps {
  label: string
}

export function DaySeparator({ label }: DaySeparatorProps) {
  return (
    <div className="flex items-center justify-center py-3" role="separator">
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

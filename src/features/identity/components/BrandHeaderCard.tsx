import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'

interface BrandHeaderCardProps {
  name: string
  meta: string
  logoUrl?: string
  logoFallback?: string
}

export function BrandHeaderCard({
  name,
  meta,
  logoUrl,
  logoFallback,
}: BrandHeaderCardProps) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-6 text-center">
      <Avatar className="size-20 rounded-2xl bg-primary">
        {logoUrl ? <AvatarImage src={logoUrl} alt={name} /> : null}
        <AvatarFallback className="rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
          {logoFallback ?? name[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="mt-1 text-lg font-semibold text-foreground">{name}</div>
      <div className="text-sm text-muted-foreground">{meta}</div>
    </div>
  )
}

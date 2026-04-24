import { cn } from '#/lib/utils'

interface OnboardingSectionTitleProps {
  title: string
  subtitle?: string
  className?: string
}

export function OnboardingSectionTitle({
  title,
  subtitle,
  className,
}: OnboardingSectionTitleProps) {
  return (
    <div
      className={cn('flex max-w-[560px] flex-col gap-3 text-center', className)}
    >
      <h1 className="text-[length:var(--font-size-3xl)] font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="text-[length:var(--font-size-md)] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  )
}

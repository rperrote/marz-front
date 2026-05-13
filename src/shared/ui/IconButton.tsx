import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithRef } from 'react'

import { cn } from '#/lib/utils'

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        ghost: 'hover:bg-surface-hover active:bg-surface-active',
        outline: 'border border-border bg-background hover:bg-surface-hover',
        solid: 'bg-primary text-primary-foreground hover:bg-primary-hover',
      },
      size: {
        sm: 'size-7 [&_svg]:size-4',
        md: 'size-9 [&_svg]:size-5',
        lg: 'size-11 [&_svg]:size-5',
      },
      shape: {
        square: '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
      shape: 'square',
    },
  },
)

export type IconButtonProps = ComponentPropsWithRef<'button'> &
  VariantProps<typeof iconButtonVariants>

export function IconButton({
  className,
  variant,
  size,
  shape,
  type = 'button',
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ variant, size, shape, className }))}
      {...props}
    />
  )
}
IconButton.displayName = 'IconButton'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// The CHTH kit's badge in its tones; outline is the shop's own (app/globals.css).
const badgeVariants = cva('chth-badge', {
  variants: {
    variant: {
      default: 'chth-badge--accent chth-badge--solid',
      secondary: 'chth-badge--neutral',
      outline: 'chth-badge--neutral chth-badge--outline',
      brand: 'chth-badge--accent',
      success: 'chth-badge--success',
      warning: 'chth-badge--warning',
      info: 'chth-badge--info',
      destructive: 'chth-badge--danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

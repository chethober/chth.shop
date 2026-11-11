import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// The CHTH kit's button (chth-kit/controls.js, styled by chth-kit/brand.css in the components
// layer, so a className here still wins). destructive-outline and link are the shop's own
// variants (app/globals.css); sizes keep the shop's compact heights through the kit's hooks.
const buttonVariants = cva('chth-btn', {
  variants: {
    variant: {
      default: 'chth-btn--primary',
      secondary: 'chth-btn--secondary',
      outline: 'chth-btn--secondary chth-btn--outline',
      ghost: 'chth-btn--ghost',
      destructive: 'chth-btn--danger',
      'destructive-outline': 'chth-btn--danger-outline',
      link: 'chth-btn--link',
    },
    size: {
      sm: 'chth-btn--sm',
      default: 'chth-btn--md',
      lg: 'chth-btn--lg',
      icon: 'chth-btn--md chth-btn--icon',
      'icon-sm': 'chth-btn--sm chth-btn--icon',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }

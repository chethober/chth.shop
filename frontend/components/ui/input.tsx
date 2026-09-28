import * as React from 'react'
import { cn } from '@/lib/utils'

/** Shared look for text-like form controls (input, textarea, select). */
export const fieldStyles =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/60 aria-invalid:focus-visible:ring-destructive/20'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} className={cn(fieldStyles, 'h-9 py-2', className)} {...props} />
  )
)
Input.displayName = 'Input'

export { Input }

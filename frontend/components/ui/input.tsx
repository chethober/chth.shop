import * as React from 'react'
import { cn } from '@/lib/utils'

/** The CHTH kit's text field (chth-kit/brand.css); shared by input, textarea and select. */
export const fieldStyles = 'chth-input'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input ref={ref} type={type} className={cn('chth-input', className)} {...props} />
  )
)
Input.displayName = 'Input'

export { Input }

import * as React from 'react'
import { cn } from '@/lib/utils'

/** The CHTH kit's textarea (chth-kit/brand.css). */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('chth-textarea', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }

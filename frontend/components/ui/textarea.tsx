import * as React from 'react'
import { cn } from '@/lib/utils'
import { fieldStyles } from './input'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldStyles, 'min-h-20 py-2', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }

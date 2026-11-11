import * as React from 'react'
import { cn } from '@/lib/utils'

/** The CHTH kit's select: a native <select>, accessible and mobile-friendly, with the kit's arrow. */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <span className="chth-select-wrap">
      <select ref={ref} className={cn('chth-select', className)} {...props}>
        {children}
      </select>
    </span>
  )
)
Select.displayName = 'Select'

export { Select }

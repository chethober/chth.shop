import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'destructive' | 'ton'

const TONES: Record<StatusTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/12 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  ton: 'bg-ton/12 text-ton',
}

interface StatusCardProps {
  /** Icon in the tinted disc; omit for a spinner. */
  icon?: LucideIcon
  tone?: StatusTone
  /** Pulses the icon, for states that are still settling. */
  pulse?: boolean
  title: React.ReactNode
  description?: React.ReactNode
  /** Details and actions under the text. */
  children?: React.ReactNode
  /** The page's main heading (h1) or a heading inside a page (h2). */
  as?: 'h1' | 'h2'
  className?: string
}

/**
 * A single-outcome screen: payment status, sign-in callback, authenticity check. Centered card,
 * tinted icon disc, title, one line of explanation, then details and actions.
 */
export function StatusCard({ icon: Icon, tone = 'neutral', pulse, title, description, children, as: Heading = 'h1', className }: StatusCardProps) {
  return (
    <Card className={cn('mx-auto w-full max-w-md space-y-5 p-6 text-center sm:p-8', className)}>
      <div className={cn('mx-auto flex size-14 items-center justify-center rounded-full', TONES[tone])}>
        {Icon ? <Icon className={cn('size-7', pulse && 'animate-pulse')} /> : <Spinner className="size-6" />}
      </div>
      <div className="space-y-1.5">
        <Heading className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</Heading>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

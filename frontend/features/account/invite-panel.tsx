'use client'

import { useEffect, useState } from 'react'
import { Gift, Send } from 'lucide-react'
import { CopyButton } from '@/components/shared/copy-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { formatPrice } from '@/lib/format'
import type { ReferralInfo } from '@/types'

/** The user's referral link, and what it has earned. */
export function InvitePanel() {
  const [info, setInfo] = useState<ReferralInfo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.referrals
      .me()
      .then(setInfo)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load referrals'))
  }, [])

  if (error) return <p className="py-10 text-center text-sm text-muted-foreground">{error}</p>
  if (!info) return <Spinner className="mx-auto" />

  const link = typeof window === 'undefined' ? `/?ref=${info.code}` : `${window.location.origin}/?ref=${info.code}`
  const shareText = `Get ${info.discountPercent}% off your first CHTH order`
  const telegramShare = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`

  const stats = [
    { label: 'Signed up', value: String(info.invited) },
    { label: 'Ordered', value: String(info.converted) },
    { label: 'Earned', value: formatPrice(info.earned) },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="size-4 text-brand" />
              Invite friends
            </CardTitle>
            <CardDescription>
              Friends get {info.discountPercent}% off their first order. You earn {info.rewardPercent}% of it as credit, paid out
              with seller payouts.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
            <code className="min-w-0 flex-1 truncate text-sm text-foreground">{link}</code>
            <CopyButton value={link} label="Copy invite link" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={telegramShare} target="_blank" rel="noreferrer">
                <Send />
                Share on Telegram
              </a>
            </Button>
            <span className="self-center text-xs text-muted-foreground">
              Code <span className="font-mono font-semibold text-foreground">{info.code}</span>
            </span>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-muted/50 p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
          {info.hasWelcomeDiscount && (
            <p className="rounded-xl bg-success/10 p-3 text-xs font-medium text-success">
              You were invited by @{info.referredBy}: {info.discountPercent}% off is applied to your first order.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

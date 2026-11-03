'use client'

import { useCallback, useEffect, useState } from 'react'
import { Play, Send, X } from 'lucide-react'
import { toast } from '@heroui/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { PAYOUT_STATUS } from '@/features/account/payouts-card'
import { shortAddress } from '@/features/collectibles/collectible-card'
import api from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/format'
import type { Payout, PayoutBalance } from '@/types'

type Overview = { balances: PayoutBalance[]; payouts: Payout[]; minAmount: number; holdDays: number; automatic: boolean }

/** Who is owed what, the payout run button, and manual actions for non-TON networks. */
export function AdminPayoutsView() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => api.admin.payouts().then(setOverview), [])

  useEffect(() => {
    api.admin
      .payouts()
      .then(setOverview)
      .catch((error) => toast.danger(error instanceof Error ? error.message : 'Failed to load payouts'))
  }, [])

  const act = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key)
    try {
      await action()
      toast.success(success)
      await load()
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setBusy(null)
    }
  }

  if (!overview) return <Spinner className="mx-auto" />

  const due = overview.balances.filter((b) => b.available >= overview.minAmount)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Balances</CardTitle>
            <CardDescription>
              Payable after shipping + {overview.holdDays} days, from {formatPrice(overview.minAmount)}. USDT-on-TON payouts are{' '}
              {overview.automatic ? 'sent automatically from the platform wallet' : 'not automatic yet (set TON_WALLET_MNEMONIC)'}.
            </CardDescription>
          </div>
          <Button
            size="sm"
            disabled={busy !== null || due.length === 0}
            onClick={() =>
              act('run', async () => {
                const result = await api.admin.runPayouts()
                if (result.skipped.length > 0) {
                  toast.warning(`Skipped (no address): ${result.skipped.map((s) => `@${s.username}`).join(', ')}`)
                }
              }, 'Payout run finished')
            }
          >
            {busy === 'run' ? <Spinner /> : <Play />}
            Run payouts ({due.length})
          </Button>
        </CardHeader>
        <CardContent>
          {overview.balances.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nobody is owed anything right now.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 font-semibold">User</th>
                  <th className="py-2 text-right font-semibold">Payable</th>
                  <th className="py-2 text-right font-semibold">On hold</th>
                  <th className="py-2 pl-4 font-semibold">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overview.balances.map((balance) => (
                  <tr key={balance.userId}>
                    <td className="py-2 font-medium text-foreground">@{balance.username}</td>
                    <td className="py-2 text-right tabular-nums text-foreground">{formatPrice(balance.available)}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{formatPrice(balance.onHold)}</td>
                    <td className="py-2 pl-4 text-muted-foreground">
                      {balance.destination ? (
                        <span className="font-mono">
                          {balance.destination.network} {shortAddress(balance.destination.address)}
                        </span>
                      ) : (
                        <span className="text-destructive">no address</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Payouts</CardTitle>
            <CardDescription>Send non-TON networks by hand, then record the transaction here.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {overview.payouts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {overview.payouts.map((payout) => (
                <li key={payout.id} className="flex flex-wrap items-center gap-3 py-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {formatPrice(payout.amount)} USDT → @{payout.username}
                    </p>
                    <p className="truncate font-mono text-muted-foreground">
                      {payout.network} {payout.address}
                    </p>
                    <p className="text-muted-foreground">
                      {formatDate(payout.createdAt)}
                      {payout.txHash && ` · ${payout.txHash}`}
                      {payout.error && <span className="text-destructive"> · {payout.error}</span>}
                    </p>
                  </div>
                  <Badge variant={PAYOUT_STATUS[payout.status].variant}>{PAYOUT_STATUS[payout.status].label}</Badge>
                  {(payout.status === 'PENDING' || payout.status === 'FAILED') && (
                    <div className="flex gap-1">
                      {payout.network === 'USDT-TON' && overview.automatic && (
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => act(payout.id, () => api.admin.sendPayout(payout.id), 'Payout sent')}>
                          <Send />
                          Send
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy !== null}
                        onClick={() => {
                          const txHash = window.prompt('Transaction hash or reference for this payout:')
                          if (txHash) act(payout.id, () => api.admin.markPayoutSent(payout.id, txHash), 'Marked as sent')
                        }}
                      >
                        Mark sent
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Cancel payout"
                        disabled={busy !== null}
                        onClick={() => act(payout.id, () => api.admin.cancelPayout(payout.id), 'Payout cancelled')}
                      >
                        <X />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

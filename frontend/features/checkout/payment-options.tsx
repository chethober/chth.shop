'use client'

import { useState } from 'react'
import { Bitcoin, CircleDollarSign, Gem } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useCryptoPayment, usePaymentMethods, type PayMethod } from './use-crypto-payment'

const STAGE_LABELS = {
  idle: '',
  starting: 'Preparing payment…',
  wallet: 'Confirm in your wallet…',
  confirming: 'Waiting for the TON network…',
}

/** The payment methods for an order as two big buttons. */
export function PaymentOptions({ orderId, className }: { orderId: string; className?: string }) {
  const methods = usePaymentMethods()
  const { pay, stage, busy } = useCryptoPayment()
  const [chosen, setChosen] = useState<PayMethod | null>(null)

  const start = async (method: PayMethod) => {
    setChosen(method)
    try {
      await pay(orderId, method)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed'
      // Wallets report a user rejection as an error; that isn't worth a red toast.
      if (/reject|cancel/i.test(message)) toast.info('Payment cancelled')
      else toast.danger(message)
    }
  }

  if (!methods) return <Spinner className="mx-auto" />

  const options = [
    methods.usdt && {
      id: 'usdt' as const,
      icon: CircleDollarSign,
      title: 'USDT on TON',
      hint: 'Pay the exact dollar amount in USDT from your TON wallet',
    },
    methods.ton && {
      id: 'ton' as const,
      icon: Gem,
      title: 'TON wallet',
      hint: `Tonkeeper, MyTonWallet, Telegram Wallet… via TON Connect${methods.tonNetwork === 'testnet' ? ' (testnet)' : ''}`,
    },
    methods.hosted && {
      id: 'hosted' as const,
      icon: Bitcoin,
      title: 'Other crypto',
      hint: methods.hostedProvider === 'mock' ? 'Development test checkout' : 'USDT, BTC, ETH, SOL and 300+ coins',
    },
  ].filter(Boolean) as { id: PayMethod; icon: typeof Gem; title: string; hint: string }[]

  if (options.length === 0) {
    return <p className="text-center text-xs text-muted-foreground">Payments are not configured on this server yet.</p>
  }

  return (
    <div className={cn('space-y-2', className)}>
      {options.map(({ id, icon: Icon, title, hint }) => (
        <button
          key={id}
          type="button"
          disabled={busy}
          onClick={() => start(id)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg',
              id === 'ton' ? 'bg-[#0098EA]/15 text-[#0098EA]' : id === 'usdt' ? 'bg-[#26A17B]/15 text-[#26A17B]' : 'bg-brand/15 text-brand'
            )}
          >
            {busy && chosen === id ? <Spinner /> : <Icon className="size-4" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{busy && chosen === id ? STAGE_LABELS[stage] : `Pay with ${title}`}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

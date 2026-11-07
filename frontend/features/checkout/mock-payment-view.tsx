'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useRequireAuth } from '@/hooks/use-require-auth'
import api from '@/lib/api'

/**
 * Development stand-in for the hosted crypto checkout (PAYMENT_PROVIDER=mock).
 * The backend refuses this provider in production.
 */
export function MockPaymentView() {
  const router = useRouter()
  const orderId = useSearchParams().get('order') ?? ''
  const isSignedIn = useRequireAuth(`/checkout/mock?order=${orderId}`)
  const [isPaying, setIsPaying] = useState(false)

  const simulate = async () => {
    setIsPaying(true)
    try {
      await api.payments.confirmMock(orderId)
      router.replace(`/checkout/complete?order=${orderId}`)
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not simulate the payment')
      setIsPaying(false)
    }
  }

  if (!isSignedIn) return null

  return (
    <Card className="mx-auto max-w-md space-y-5 p-6 text-center sm:p-8">
      <FlaskConical className="mx-auto size-10 text-brand" />
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-foreground">Test crypto checkout</h1>
        <p className="text-sm text-muted-foreground">
          The server is using the development payment provider. In production, buyers land on the NOWPayments checkout
          here and pay in USDT, BTC, ETH, TON and more.
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={simulate} disabled={isPaying || !orderId}>
          {isPaying && <Spinner />}
          Simulate successful payment
        </Button>
        <Button variant="outline" onClick={() => router.push('/account?tab=orders')}>
          Cancel
        </Button>
      </div>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { toast } from '@heroui/react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'

/** Starts (or resumes) the crypto checkout for an order and sends the buyer there. */
export function PayButton({ orderId, children, ...props }: { orderId: string } & ButtonProps) {
  const [isStarting, setIsStarting] = useState(false)

  const pay = async () => {
    setIsStarting(true)
    try {
      const { paymentUrl } = await api.orders.pay(orderId)
      window.location.href = paymentUrl
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not start the payment')
      setIsStarting(false)
    }
  }

  return (
    <Button onClick={pay} disabled={isStarting} {...props}>
      {isStarting ? <Spinner /> : <Bitcoin />}
      {children ?? 'Pay with crypto'}
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { Bitcoin } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PaymentOptions } from './payment-options'

/** Opens the payment method picker for an unpaid order. */
export function PayButton({ orderId, children, ...props }: { orderId: string } & ButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} {...props}>
        <Bitcoin />
        {children ?? 'Pay with crypto'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pay #{orderId.slice(0, 8).toUpperCase()}</DialogTitle>
            <DialogDescription>Choose how you want to pay.</DialogDescription>
          </DialogHeader>
          <PaymentOptions orderId={orderId} />
        </DialogContent>
      </Dialog>
    </>
  )
}

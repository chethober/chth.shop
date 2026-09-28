'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, CreditCard, MapPin } from 'lucide-react'
import { toast } from '@heroui/react'
import { CopyButton } from '@/components/shared/copy-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import api from '@/lib/api'
import type { Cart, Order } from '@/types'
import { OrderSummary } from './order-summary'

interface CheckoutDialogProps {
  cart: Cart
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderPlaced: () => void
}

export function CheckoutDialog({ cart, open, onOpenChange, onOrderPlaced }: CheckoutDialogProps) {
  const [shippingAddress, setShippingAddress] = useState('')
  const [isPlacing, setIsPlacing] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)

  const close = () => {
    onOpenChange(false)
    setOrder(null)
  }

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!shippingAddress.trim()) return

    setIsPlacing(true)
    try {
      setOrder(await api.orders.create(shippingAddress.trim()))
      setShippingAddress('')
      onOrderPlaced()
      toast.success('Order placed!')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not place your order')
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        {order ? (
          <div className="space-y-5 py-4 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-9" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-xl">Order placed</DialogTitle>
              <DialogDescription>We&apos;re preparing it for printing and delivery.</DialogDescription>
              <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                Order ID: <code className="font-semibold text-foreground">{order.id.slice(0, 8).toUpperCase()}</code>
                <CopyButton value={order.id} label="Copy order ID" />
              </p>
            </div>
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/account?tab=orders" onClick={close}>
                  View orders
                </Link>
              </Button>
              <Button variant="outline" onClick={close}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={placeOrder} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Checkout
              </DialogTitle>
              <DialogDescription>Enter your shipping details to place the order.</DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label htmlFor="shipping-address">
                <MapPin className="size-3.5" />
                Shipping address
              </Label>
              <Textarea
                id="shipping-address"
                required
                rows={3}
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                placeholder="Street, city, postal code, country"
              />
            </div>

            <OrderSummary cart={cart} className="rounded-xl border border-border bg-muted/30 p-4" />

            <DialogFooter>
              <Button variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPlacing || !shippingAddress.trim()}>
                {isPlacing ? <Spinner /> : <CheckCircle2 />}
                {isPlacing ? 'Placing order…' : 'Place order'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

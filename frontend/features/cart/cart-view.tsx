'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CreditCard, ShoppingBag } from 'lucide-react'
import { toast } from '@heroui/react'
import { ConfirmButton } from '@/components/shared/confirm-button'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRequireAuth } from '@/hooks/use-require-auth'
import useCartStore from '@/store/cart-store'
import { CartLineItem } from './cart-line-item'
import { CheckoutDialog } from './checkout-dialog'
import { OrderSummary } from './order-summary'

function showError(error: unknown) {
  toast.danger(error instanceof Error ? error.message : 'Something went wrong')
}

export function CartView() {
  const isSignedIn = useRequireAuth('/cart')
  const { cart, isLoading, fetchCart, updateItem, removeItem, clear } = useCartStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    if (isSignedIn) fetchCart()
  }, [isSignedIn, fetchCart])

  if (!isSignedIn || (isLoading && !cart)) return <LoadingState label="Loading your cart…" />

  const items = cart?.items ?? []

  return (
    <>
      <PageHeader title="Cart" description="Review your items before checkout." />

      {!cart || items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Discover custom pieces made by independent artists."
          action={
            <>
              <Button asChild>
                <Link href="/">Explore items</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/design">Start designing</Link>
              </Button>
            </>
          }
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle>Items ({cart.totalItems})</CardTitle>
                <ConfirmButton
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  question="Clear your cart?"
                  confirmLabel="Clear"
                  onConfirm={() => clear().catch(showError)}
                >
                  Clear cart
                </ConfirmButton>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {items.map((item, index) => (
                    <CartLineItem
                      key={item.id}
                      item={item}
                      index={index}
                      onQuantityChange={(quantity) => quantity >= 1 && updateItem(item.id, quantity).catch(showError)}
                      onRemove={() => removeItem(item.id).catch(showError)}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-24 lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <OrderSummary cart={cart} />
                <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                  <CreditCard />
                  Proceed to checkout
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <CheckoutDialog cart={cart} open={checkoutOpen} onOpenChange={setCheckoutOpen} onOrderPlaced={fetchCart} />
        </div>
      )}
    </>
  )
}

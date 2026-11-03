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
import { useT } from '@/lib/i18n'

function showError(error: unknown) {
  toast.danger(error instanceof Error ? error.message : 'Something went wrong')
}

export function CartView() {
  const t = useT()
  const isSignedIn = useRequireAuth('/cart')
  const { cart, isLoading, fetchCart, updateItem, removeItem, clear } = useCartStore()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    if (isSignedIn) fetchCart()
  }, [isSignedIn, fetchCart])

  if (!isSignedIn || (isLoading && !cart)) return <LoadingState label={t("Loading your cart…")} />

  const items = cart?.items ?? []

  return (
    <>
      <PageHeader title={t("Cart")} description={t("Review your items before checkout.")} />

      {!cart || items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t("Your cart is empty")}
          description={t("Discover merch from independent artists and merchants.")}
          action={
            <>
              <Button asChild>
                <Link href="/shop">{t("Explore the shop")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/design">{t("Start designing")}</Link>
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
                  {t("Clear cart")}
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
                <CardTitle>{t("Order summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <OrderSummary cart={cart} />
                <Button className="w-full" onClick={() => setCheckoutOpen(true)}>
                  <CreditCard />
                  {t("Proceed to checkout")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

        </div>
      )}

      {/* Outside the branch above: placing the order empties the cart, and the dialog must stay for payment. */}
      {cart && <CheckoutDialog cart={cart} open={checkoutOpen} onOpenChange={setCheckoutOpen} onOrderPlaced={fetchCart} />}
    </>
  )
}

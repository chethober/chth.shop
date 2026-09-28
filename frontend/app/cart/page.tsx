import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { CartView } from '@/features/cart/cart-view'

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Your shopping cart on CHTH',
}

export default function CartPage() {
  return (
    <PageContainer>
      <CartView />
    </PageContainer>
  )
}

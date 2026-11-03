import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { ShopView } from '@/features/shop/shop-view'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Merch from independent artists and merchants, printed on demand and paid in crypto.',
}

export default function ShopPage() {
  return (
    <PageContainer>
      <Suspense>
        <ShopView />
      </Suspense>
    </PageContainer>
  )
}

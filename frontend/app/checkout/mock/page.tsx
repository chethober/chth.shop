import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { MockPaymentView } from '@/features/checkout/mock-payment-view'

export const metadata: Metadata = {
  title: 'Test payment',
  description: 'Development stand-in for the crypto checkout',
}

export default function MockCheckoutPage() {
  return (
    <PageContainer>
      <Suspense>
        <MockPaymentView />
      </Suspense>
    </PageContainer>
  )
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageContainer } from '@/components/layout/page-container'
import { PaymentStatusView } from '@/features/checkout/payment-status-view'

export const metadata: Metadata = {
  title: 'Payment',
  description: 'Your crypto payment status',
}

export default function CheckoutCompletePage() {
  return (
    <PageContainer>
      <Suspense>
        <PaymentStatusView />
      </Suspense>
    </PageContainer>
  )
}

import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { CollabView } from '@/features/collab/collab-view'

export const metadata: Metadata = {
  title: 'Sell on CHTH',
  description: 'Open a CHTH store as an artist or merchant: 25% of every sale, zero upfront cost, crypto payouts.',
}

export default function CollabPage() {
  return (
    <PageContainer className="justify-center gap-6">
      <CollabView />
    </PageContainer>
  )
}

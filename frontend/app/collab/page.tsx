import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { AgreementCard } from '@/features/collab/agreement-card'
import { EconomicsCard } from '@/features/collab/economics-card'

export const metadata: Metadata = {
  title: 'Sell on CHTH',
  description: 'Open a CHTH store as an artist or merchant: 75% of the margin, zero upfront cost, crypto payouts.',
}

export default function CollabPage() {
  return (
    <PageContainer className="justify-center">
      <div className="grid w-full grid-cols-1 items-stretch gap-5 lg:grid-cols-12 lg:gap-6">
        <EconomicsCard />
        <AgreementCard />
      </div>
    </PageContainer>
  )
}

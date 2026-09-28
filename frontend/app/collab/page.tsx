import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { AgreementCard } from '@/features/collab/agreement-card'
import { EconomicsCard } from '@/features/collab/economics-card'

export const metadata: Metadata = {
  title: 'Artist Collaboration',
  description: 'Join the CHTH artist program: 25% royalties, zero upfront cost, full IP ownership.',
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

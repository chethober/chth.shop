import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { Eyebrow } from '@/components/shared/eyebrow'
import { CollabBento } from '@/features/collab/collab-bento'

export const metadata: Metadata = {
  title: 'Artist Collaboration',
  description: 'Join the CHTH artist program: 25% royalties, zero upfront cost, full IP ownership.',
}

export default function CollabPage() {
  return (
    <PageContainer className="justify-center gap-6">
      <div className="space-y-3">
        <Eyebrow pulse>Artist program</Eyebrow>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Your art. <span className="font-serif font-light italic text-foreground/90">Our hustle.</span>
        </h1>
      </div>

      <CollabBento />
    </PageContainer>
  )
}

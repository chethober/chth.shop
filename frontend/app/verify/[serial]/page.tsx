import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { VerifyView } from '@/features/collectibles/verify-view'

export const metadata: Metadata = {
  title: 'Verify item',
  description: 'Check that a CHTH item is authentic and see its NFT certificate.',
}

export default async function VerifyPage({ params }: { params: Promise<{ serial: string }> }) {
  const { serial } = await params
  return (
    <PageContainer>
      <VerifyView serial={decodeURIComponent(serial)} />
    </PageContainer>
  )
}

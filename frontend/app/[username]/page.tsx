import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { StorefrontView } from '@/features/storefront/storefront-view'

type Params = Promise<{ username: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${decodeURIComponent(username)}`,
    description: 'Creator collection and merchandise on CHTH',
  }
}

export default async function StorefrontPage({ params }: { params: Params }) {
  const { username } = await params
  return (
    <PageContainer>
      <StorefrontView key={username} username={decodeURIComponent(username)} />
    </PageContainer>
  )
}

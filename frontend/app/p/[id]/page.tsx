import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { ProductView } from '@/features/product/product-view'

export const metadata: Metadata = { title: 'Product' }

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <PageContainer>
      <ProductView id={id} />
    </PageContainer>
  )
}

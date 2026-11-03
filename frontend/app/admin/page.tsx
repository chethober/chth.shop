import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { AdminOrdersView } from '@/features/admin/admin-orders-view'

export const metadata: Metadata = {
  title: 'Fulfillment',
  description: 'Marketplace orders',
}

export default function AdminPage() {
  return (
    <PageContainer>
      <AdminOrdersView />
    </PageContainer>
  )
}

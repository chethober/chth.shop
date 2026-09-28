import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { AccountView } from '@/features/account/account-view'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Manage your creator account on CHTH',
}

export default function AccountPage() {
  return (
    <PageContainer>
      <AccountView />
    </PageContainer>
  )
}

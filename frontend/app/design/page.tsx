import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { DesignStudio } from '@/features/design/design-studio'

export const metadata: Metadata = {
  title: 'Design Studio',
  description: 'Interactive 3D garment design studio by CHTH',
}

export default function DesignPage() {
  return (
    <PageContainer>
      <DesignStudio />
    </PageContainer>
  )
}

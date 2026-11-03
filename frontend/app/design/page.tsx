import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DesignStudio } from '@/features/design/design-studio'

export const metadata: Metadata = {
  title: 'Design Studio',
  description: 'Design custom tees, hoodies, pants, mugs, caps and totes in 3D',
}

export default function DesignPage() {
  return (
    <Suspense>
      <DesignStudio />
    </Suspense>
  )
}

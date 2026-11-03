import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SignInView } from '@/features/auth/sign-in-view'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to CHTH with Google or Telegram',
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInView />
    </Suspense>
  )
}

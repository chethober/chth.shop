'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/store/auth-store'
import { useHydrated } from './use-hydrated'

/**
 * Sends signed-out visitors to the sign-in page, returning them to `returnTo` afterwards.
 * Returns true once the visitor is known to be signed in.
 */
export function useRequireAuth(returnTo: string) {
  const router = useRouter()
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace(`/auth?redirect=${encodeURIComponent(returnTo)}`)
  }, [hydrated, isAuthenticated, returnTo, router])

  return hydrated && isAuthenticated
}

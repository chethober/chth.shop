'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { StatusCard } from '@/components/shared/status-card'
import useAuthStore from '@/store/auth-store'
import type { User } from '@/types'
import { consumeRedirect } from './redirect'

function parseUser(raw: string | null): User | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Finishes a Google / X sign-in: the backend redirects here with `?token=&user=`. */
export function OAuthCallbackView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const signIn = useAuthStore((state) => state.signIn)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const handled = useRef(false)

  const token = searchParams.get('token')
  const rawUser = searchParams.get('user')
  const user = useMemo(() => parseUser(rawUser), [rawUser])
  const isValid = Boolean(token && user && !searchParams.get('error'))

  useEffect(() => {
    if (!isValid || handled.current) return
    handled.current = true
    signIn(user!, token!)
    toast.success(`Welcome, ${user!.username}!`)
  }, [isValid, user, token, signIn])

  const status = !isValid ? 'error' : isAuthenticated ? 'success' : 'loading'

  useEffect(() => {
    if (status !== 'success') return
    const timer = setTimeout(() => router.replace(consumeRedirect()), 800)
    return () => clearTimeout(timer)
  }, [status, router])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      {status === 'loading' && <StatusCard title="Completing sign-in…" className="max-w-sm" />}
      {status === 'success' && <StatusCard icon={CheckCircle2} tone="success" title="Signed in" description="Taking you back…" className="max-w-sm" />}
      {status === 'error' && (
        <StatusCard icon={XCircle} tone="destructive" title="Sign-in failed" description="Something went wrong with the provider. Please try again." className="max-w-sm">
          <Button asChild>
            <Link href="/auth">Back to sign in</Link>
          </Button>
        </StatusCard>
      )}
    </div>
  )
}

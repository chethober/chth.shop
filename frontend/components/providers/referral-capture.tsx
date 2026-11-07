'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from '@/lib/toast'
import api from '@/lib/api'
import useAuthStore from '@/store/auth-store'

const STORAGE_KEY = 'chth-referral'

/** Remembers `?ref=CODE` and applies it once the visitor is signed in. */
export function ReferralCapture() {
  const searchParams = useSearchParams()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (ref) {
      try {
        localStorage.setItem(STORAGE_KEY, ref.trim().toUpperCase())
      } catch {
        // Storage unavailable: the code is simply not remembered.
      }
    }
  }, [ref])

  useEffect(() => {
    if (!isAuthenticated) return
    let code: string | null = null
    try {
      code = localStorage.getItem(STORAGE_KEY)
      if (code) localStorage.removeItem(STORAGE_KEY)
    } catch {
      return
    }
    if (!code) return
    api.referrals
      .claim(code)
      .then((message) => toast.success(message))
      .catch(() => {
        // Already referred, own code, or not a new customer: nothing to tell.
      })
  }, [isAuthenticated])

  return null
}

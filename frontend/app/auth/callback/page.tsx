'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Cookies from 'js-cookie'
import { api } from '@/lib/api'
import useAuthStore from '@/store/authStore'
import type { User } from '@/types'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeOAuth } = useAuthStore()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token')
        const userParam = searchParams.get('user')
        const error = searchParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          return
        }

        if (!token) {
          setStatus('error')
          setMessage('Missing token in callback.')
          return
        }

        let user: User | null = null

        if (userParam) {
          try {
            // Some routers auto-decode the query; handle both encoded and decoded safely
            const maybeDecoded = (() => {
              try { return decodeURIComponent(userParam) } catch { return userParam }
            })()
            user = JSON.parse(maybeDecoded)
          } catch {
            user = null
          }
        }

        if (!user) {
          // Set token locally so subsequent API calls include Authorization
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', token)
            Cookies.set('token', token, { expires: 7 })
          }
          // Fetch profile from backend to get the user object
          const fetchedUser = await api.getProfile()
          await completeOAuth(fetchedUser as User, token)
        } else {
          await completeOAuth(user, token)
        }
        
        setStatus('success')
        setMessage('Authentication successful! Redirecting...')
        setTimeout(() => {
          router.push('/')
        }, 1200)
        
      } catch (error: any) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setMessage(error.message || 'Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, router, completeOAuth])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground">Authentication</h2>
          <p className="mt-2 text-muted-foreground">
            Processing your authentication...
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-xl p-8 text-center"
        >
          {status === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
              <p className="text-foreground">Processing authentication...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-foreground">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-foreground">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary"
              >
                Back to Login
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground text-xs">Authenticating...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
} 
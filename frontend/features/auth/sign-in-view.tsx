'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Info, X } from 'lucide-react'
import { toast } from '@heroui/react'
import { SonarGrid } from '@/components/custom/sonar-grid'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import type { TelegramAuthData, TelegramConfig } from '@/types'
import { describeAuthError } from './auth-errors'
import { GoogleIcon, TelegramIcon, XIcon } from './provider-icons'
import { rememberRedirect, safeRedirectPath } from './redirect'

type Provider = 'google' | 'x' | 'telegram'

const providerButtonStyles =
  'group flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-secondary/80 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:text-sm'

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthData) => void
  }
}

export function SignInView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))
  const errorCode = searchParams.get('error')

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const signInWithTelegram = useAuthStore((state) => state.signInWithTelegram)

  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null)
  const telegramContainerRef = useRef<HTMLDivElement>(null)

  const errorMessage = errorCode && !dismissedError ? describeAuthError(errorCode) : ''

  useEffect(() => {
    if (isAuthenticated) router.replace(redirectTo)
  }, [isAuthenticated, redirectTo, router])

  useEffect(() => {
    api.auth
      .telegramConfig()
      .then(setTelegramConfig)
      .catch(() => setTelegramConfig({ botUsername: '', isConfigured: false }))
  }, [])

  // The Telegram widget reports back through a global callback.
  useEffect(() => {
    window.onTelegramAuth = async (data) => {
      setLoadingProvider('telegram')
      try {
        const user = await signInWithTelegram(data)
        toast.success(`Welcome, ${user.username}!`)
        setTelegramOpen(false)
        router.replace(redirectTo)
      } catch (error) {
        toast.danger(error instanceof Error ? error.message : 'Telegram sign-in failed')
      } finally {
        setLoadingProvider(null)
      }
    }
    return () => {
      delete window.onTelegramAuth
    }
  }, [signInWithTelegram, router, redirectTo])

  // Inject the Telegram widget script whenever the dialog opens.
  useEffect(() => {
    const container = telegramContainerRef.current
    if (!telegramOpen || !telegramConfig?.isConfigured || !container) return

    container.innerHTML = ''
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.dataset.telegramLogin = telegramConfig.botUsername
    script.dataset.size = 'large'
    script.dataset.radius = '8'
    script.dataset.requestAccess = 'write'
    script.dataset.onauth = 'onTelegramAuth(user)'
    container.appendChild(script)
  }, [telegramOpen, telegramConfig])

  const startOAuth = (provider: 'google' | 'x') => {
    setLoadingProvider(provider)
    rememberRedirect(redirectTo)
    window.location.href = provider === 'google' ? api.auth.googleUrl : api.auth.xUrl
  }

  return (
    <SonarGrid
      id="login-sonar-grid"
      spacing={26}
      dotRadius={1.4}
      baseOpacity={0.15}
      pingEvery={7.0}
      ringWidth={80}
      speed={240}
      interactive
      className="relative flex min-h-[calc(100vh-4rem)] w-full flex-1 flex-col items-center justify-center px-4 pb-12 pt-20 sm:pb-16 sm:pt-24"
    >
      {/* Soft wash behind the card keeps text crisp while rings pass underneath. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--background)/0.75)_0%,transparent_100%)]"
      />

      <div className="w-full max-w-[380px] space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-1.5 text-center"
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Sign in</h1>
          <p className="text-sm text-muted-foreground">Continue with your preferred account</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="space-y-3.5 rounded-2xl border border-border/80 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-xl sm:p-6 dark:shadow-black/25"
        >
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p className="flex-1 font-medium leading-relaxed">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setDismissedError(true)}
                  aria-label="Dismiss error"
                  className="cursor-pointer text-destructive/70 transition-colors hover:text-destructive"
                >
                  <X className="size-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => startOAuth('google')}
              disabled={loadingProvider !== null}
              className={cn(providerButtonStyles, 'justify-center')}
            >
              {loadingProvider === 'google' ? (
                <Spinner className="text-muted-foreground" />
              ) : (
                <GoogleIcon className="size-4 shrink-0 transition-transform group-hover:scale-110" />
              )}
              Google
            </button>

            <button
              type="button"
              onClick={() => startOAuth('x')}
              disabled={loadingProvider !== null}
              className={cn(providerButtonStyles, 'justify-center')}
            >
              {loadingProvider === 'x' ? (
                <Spinner className="text-muted-foreground" />
              ) : (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-foreground p-0.5 text-background transition-transform group-hover:scale-110">
                  <XIcon className="size-3" />
                </span>
              )}
              Twitter
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTelegramOpen(true)}
            disabled={loadingProvider !== null}
            className={cn(providerButtonStyles, 'w-full justify-between')}
          >
            <span className="flex items-center gap-2.5">
              {loadingProvider === 'telegram' ? (
                <Spinner className="text-muted-foreground" />
              ) : (
                <TelegramIcon className="size-4 shrink-0 text-[#24A1DE] transition-transform group-hover:rotate-[-4deg] group-hover:scale-110" />
              )}
              Telegram
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/80 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
              <span className="size-1.5 rounded-full bg-[#24A1DE]" />
              Management Bot
            </span>
          </button>
        </motion.div>

        <p className="px-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
            Terms of Service
          </Link>
          .
        </p>
      </div>

      <Dialog open={telegramOpen} onOpenChange={setTelegramOpen}>
        <DialogContent className="max-w-sm text-center">
          <TelegramIcon className="mx-auto mt-2 size-12 text-[#24A1DE]" />
          <DialogHeader className="text-center">
            <DialogTitle>Sign in with Telegram</DialogTitle>
            <DialogDescription>
              Authenticate via the CHTH Management Bot
              {telegramConfig?.botUsername ? ` (@${telegramConfig.botUsername})` : ''}
            </DialogDescription>
          </DialogHeader>

          {telegramConfig?.isConfigured ? (
            <div ref={telegramContainerRef} className="flex min-h-[50px] items-center justify-center py-3" />
          ) : (
            <div className="space-y-2 rounded-xl border border-border bg-secondary/60 p-3.5 text-left text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="size-3.5 text-brand" />
                Telegram bot setup
              </p>
              <p className="text-[11px] leading-relaxed">
                To enable Telegram sign-in, add your bot credentials to{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">backend/.env</code>:
              </p>
              <ul className="space-y-0.5 pl-2 font-mono text-[10px] text-foreground/80">
                <li>TELEGRAM_BOT_TOKEN=...</li>
                <li>TELEGRAM_BOT_USERNAME=...</li>
              </ul>
            </div>
          )}

          <Button variant="outline" onClick={() => setTelegramOpen(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </SonarGrid>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { SonarGrid } from '@/components/custom/sonar-grid'
import { Spinner } from '@/components/ui/spinner'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import { describeAuthError } from './auth-errors'
import { GoogleIcon, TelegramIcon, XIcon } from './provider-icons'
import { rememberRedirect, safeRedirectPath } from './redirect'
import { useT } from '@/lib/i18n'

type Provider = 'google' | 'x' | 'telegram'

const providerButtonStyles =
  'group flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-xs font-medium text-foreground shadow-xs backdrop-blur-md transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5 hover:border-foreground/30 hover:bg-secondary/80 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-75 sm:text-sm'

export function SignInView() {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))
  const errorCode = searchParams.get('error')

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const [dismissedError, setDismissedError] = useState(false)

  const errorMessage = errorCode && !dismissedError ? describeAuthError(errorCode) : ''

  useEffect(() => {
    if (isAuthenticated) router.replace(redirectTo)
  }, [isAuthenticated, redirectTo, router])

  const startOAuth = (provider: Provider) => {
    setLoadingProvider(provider)
    rememberRedirect(redirectTo)
    window.location.href = api.auth.providerUrl(provider)
  }

  // Opens the bot in Telegram; its sign-in button lands on /auth/callback in a new tab.
  const startBotLogin = () => {
    window.open(api.auth.telegramBotUrl(), '_blank', 'noopener')
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
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{t("Sign in")}</h1>
          <p className="text-sm text-muted-foreground">{t("Continue with your preferred account")}</p>
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
                  aria-label={t("Dismiss error")}
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
            onClick={() => startOAuth('telegram')}
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
          </button>

          <button
            type="button"
            onClick={startBotLogin}
            disabled={loadingProvider !== null}
            className={cn(providerButtonStyles, 'w-full justify-between')}
          >
            <span className="flex items-center gap-2.5">
              <TelegramIcon className="size-4 shrink-0 text-[#24A1DE] transition-transform group-hover:rotate-[-4deg] group-hover:scale-110" />
              Sign in via bot
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-border/80 bg-secondary/80 px-2.5 py-0.5 text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
              <span className="size-1.5 rounded-full bg-[#24A1DE]" />
              {t("Management Bot")}
            </span>
          </button>
        </motion.div>

        <p className="px-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80">
            {t("Terms of Service")}
          </Link>
          .
        </p>
      </div>

    </SonarGrid>
  )
}

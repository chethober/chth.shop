'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ExternalLink, FileText } from 'lucide-react'
import { toast } from '@heroui/react'
import { ArrowFillButton } from '@/components/custom/arrow-fill-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useHydrated } from '@/hooks/use-hydrated'
import api from '@/lib/api'
import useAuthStore from '@/store/auth-store'
import { AGREEMENT_CLAUSES, AGREEMENT_FOOTNOTE, AGREEMENT_NOTICE, AGREEMENT_VERSION } from './agreement-content'

export function AgreementCard() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { user, isAuthenticated, patchUser } = useAuthStore()
  const [isAccepting, setIsAccepting] = useState(false)
  const [readProgress, setReadProgress] = useState(0)

  const isSignedIn = hydrated && isAuthenticated
  const isArtist = isSignedIn && Boolean(user?.isArtist)

  const trackReading = (event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const scrollable = el.scrollHeight - el.clientHeight
    if (scrollable > 0) setReadProgress(Math.round((el.scrollTop / scrollable) * 100))
  }

  const accept = async () => {
    if (!isSignedIn) {
      toast.warning('Please sign in to join the artist program')
      router.push('/auth?redirect=/collab')
      return
    }

    setIsAccepting(true)
    try {
      await api.artists.acceptContract()
      patchUser({ isArtist: true })
      toast.success('Agreement accepted! Welcome to the collective.')
      router.push('/account?tab=store')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Failed to accept the agreement')
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="lg:col-span-6"
    >
      <Card className="flex h-[540px] flex-col overflow-hidden sm:h-[580px] lg:h-full">
        <div className="flex shrink-0 items-center justify-between gap-3 bg-muted/30 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-md bg-muted">
              <FileText className="size-3.5 text-brand" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-tight text-foreground">Artist Collaboration Agreement</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">CHTH // {AGREEMENT_VERSION}</p>
            </div>
          </div>
          <Badge variant={isArtist ? 'success' : 'secondary'}>
            <span className="size-1.5 rounded-full bg-current" />
            {isArtist ? 'Active partner' : 'Pending'}
          </Badge>
        </div>

        <div className="h-0.5 shrink-0">
          <div
            className="h-full bg-brand transition-all duration-150"
            style={{ width: isArtist ? '100%' : `${readProgress}%` }}
          />
        </div>

        <div onScroll={trackReading} className="flex-1 space-y-4 overflow-y-auto p-5 text-xs leading-relaxed text-muted-foreground sm:p-6">
          <p className="rounded-xl bg-muted/40 p-3.5 text-[11px] text-foreground">{AGREEMENT_NOTICE}</p>
          {AGREEMENT_CLAUSES.map((clause) => (
            <section key={clause.title}>
              <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-foreground">{clause.title}</h2>
              <p>{clause.body}</p>
            </section>
          ))}
          <p className="pt-2 text-[11px] text-muted-foreground/80">{AGREEMENT_FOOTNOTE}</p>
        </div>

        <div className="flex shrink-0 flex-col items-center justify-between gap-3 bg-muted/30 p-4 sm:flex-row sm:p-5">
          {isArtist ? (
            <>
              <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Check className="size-4 shrink-0 text-success" />
                You are an active CHTH artist partner
              </p>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/account?tab=store">
                  Artist dashboard
                  <ExternalLink />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground">
                {isSignedIn ? `Signed in as @${user?.username}` : 'Instant collective access'}
              </p>
              <ArrowFillButton
                type="button"
                onClick={accept}
                disabled={isAccepting}
                bgColor="#10b981"
                textColor="#ffffff"
                fillBgColor="#ffffff"
                fillTextColor="#10b981"
                hoverFillBgColor="#ffffff"
                hoverFillTextColor="#10b981"
                arrowColor="#10b981"
                hoverArrowColor="#10b981"
                className="h-11 w-full px-5 text-xs font-semibold shadow-sm shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {isAccepting ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-3.5" />
                    Accepting…
                  </span>
                ) : isSignedIn ? (
                  'Accept & join collective'
                ) : (
                  'Sign in & accept'
                )}
              </ArrowFillButton>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

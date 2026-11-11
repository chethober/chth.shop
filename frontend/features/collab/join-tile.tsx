'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { toast } from '@/lib/toast'
import { SlideConfirm } from '@/components/custom/slide-to-confirm'
import { Button } from '@/components/ui/button'
import { useHydrated } from '@/hooks/use-hydrated'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import type { StoreKind } from '@/types'

export function JoinTile() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { user, isAuthenticated, patchUser } = useAuthStore()
  const [kind, setKind] = useState<StoreKind>('ARTIST')

  const isSignedIn = hydrated && isAuthenticated
  const isSeller = isSignedIn && Boolean(user?.isSeller)

  const accept = async () => {
    try {
      await api.stores.acceptContract(kind)
      patchUser({ isSeller: true })
      toast.success('Your store is ready.')
      router.push('/account?tab=store')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Failed to accept the agreement')
    }
  }

  return (
    <div className="flex h-full flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
      <div className="space-y-1">
        <p className="text-lg font-extrabold tracking-tight text-foreground">
          {isSeller ? "You're in." : 'Open your store'}
        </p>
        <Link
          href="/terms"
          className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {isSeller ? 'Terms' : 'By joining you accept the terms'}
          <ArrowRight className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isSeller ? (
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <Check className="size-4" />
            Active partner
          </span>
          <Button asChild size="lg" className="ml-auto sm:ml-0">
            <Link href="/account?tab=store">
              Dashboard
              <ExternalLink />
            </Link>
          </Button>
        </div>
      ) : isSignedIn ? (
        <div className="flex flex-col items-center gap-2 self-center sm:items-end sm:self-auto">
          <div role="radiogroup" aria-label="I am joining as" className="inline-flex rounded-lg border border-border bg-background p-0.5">
            {(['ARTIST', 'MERCHANT'] as const).map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={kind === option}
                onClick={() => setKind(option)}
                className={cn(
                  'cursor-pointer rounded-md px-3 py-1 text-[11px] font-semibold transition-colors',
                  kind === option ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option === 'ARTIST' ? 'Artist' : 'Merchant'}
              </button>
            ))}
          </div>
          <SlideConfirm
            label="Slide to join"
            confirmedLabel="Joined"
            onConfirm={accept}
            width={280}
          />
        </div>
      ) : (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/auth?redirect=/collab">
            Sign in to join
            <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  )
}

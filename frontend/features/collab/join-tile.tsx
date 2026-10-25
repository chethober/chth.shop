'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { toast } from '@heroui/react'
import { SlideConfirm } from '@/components/custom/slide-to-confirm'
import { Button } from '@/components/ui/button'
import { useHydrated } from '@/hooks/use-hydrated'
import api from '@/lib/api'
import useAuthStore from '@/store/auth-store'

export function JoinTile() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { user, isAuthenticated, patchUser } = useAuthStore()

  const isSignedIn = hydrated && isAuthenticated
  const isArtist = isSignedIn && Boolean(user?.isArtist)

  const accept = async () => {
    try {
      await api.artists.acceptContract()
      patchUser({ isArtist: true })
      toast.success('Welcome to the collective.')
      router.push('/account?tab=store')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Failed to accept the agreement')
    }
  }

  return (
    <div className="flex h-full flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
      <div className="space-y-1">
        <p className="text-lg font-extrabold tracking-tight text-foreground">
          {isArtist ? "You're in." : 'Join the collective'}
        </p>
        <Link
          href="/terms"
          className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {isArtist ? 'Terms' : 'By joining you accept the terms'}
          <ArrowRight className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isArtist ? (
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
        <SlideConfirm
          label="Slide to join"
          confirmedLabel="Joined"
          onConfirm={accept}
          width={280}
          className="self-center sm:self-auto"
        />
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

'use client'

import { motion } from 'framer-motion'
import { Calendar, Package, Share2, UserCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import useAuthStore from '@/store/auth-store'
import { toast } from '@/lib/toast'
import { SocialLinks } from '@/components/shared/social-links'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { STORE_KIND_LABELS } from '@/lib/products'
import type { Store } from '@/types'

async function shareStore(title: string) {
  const url = window.location.href
  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return
    } catch {
      // Cancelled or unsupported: fall back to copying the link.
    }
  }
  await navigator.clipboard.writeText(url)
  toast.info('Link copied to clipboard')
}

export function StoreProfileCard({ store, productCount }: { store: Store; productCount: number }) {
  const username = store.user?.username ?? ''
  const displayName = store.storeName || username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-brand/25 via-muted to-muted sm:h-24" />
        <div className="space-y-5 px-5 pb-5 sm:px-6 sm:pb-6">
          {/* The avatar overlaps the cover; under it, identity on the left and actions on the right,
              the same header as the account page. */}
          <div className="-mt-8 flex size-16 items-center justify-center rounded-2xl bg-muted text-xl font-bold text-foreground ring-4 ring-card sm:-mt-10 sm:size-20 sm:text-2xl">
            {initials}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="min-w-0 space-y-0.5">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{displayName}</h1>
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  @{username}
                  <Badge variant="secondary">{STORE_KIND_LABELS[store.kind]}</Badge>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              <FollowButton username={username} initialFollowing={Boolean(store.isFollowing)} initialCount={store.followerCount ?? 0} />
              <Button variant="outline" onClick={() => shareStore(`${displayName} on CHTH`)}>
                <Share2 />
                Share
              </Button>
            </div>
          </div>

          <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {store.bio ||
              (store.kind === 'MERCHANT'
                ? 'Official merchandise, printed on demand.'
                : 'This artist creates unique custom merchandise and apparel.')}
          </p>

          <SocialLinks socials={store} />

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {store.createdAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                <Calendar className="size-3.5" />
                Joined {formatDate(store.createdAt)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <Package className="size-3.5" />
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function FollowButton({ username, initialFollowing, initialCount }: { username: string; initialFollowing: boolean; initialCount: number }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const me = useAuthStore((state) => state.user?.username)
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  if (me === username) {
    return (
      <span className="self-center text-xs text-muted-foreground">
        {count} {count === 1 ? 'follower' : 'followers'}
      </span>
    )
  }

  const toggle = async () => {
    if (!isAuthenticated) {
      toast.warning('Sign in to follow stores')
      return
    }
    setBusy(true)
    try {
      setCount(await (following ? api.stores.unfollow(username) : api.stores.follow(username)))
      setFollowing(!following)
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant={following ? 'outline' : 'default'} onClick={toggle} disabled={busy}>
      {following ? <UserCheck /> : <UserPlus />}
      {following ? 'Following' : 'Follow'} · {count}
    </Button>
  )
}

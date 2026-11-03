'use client'

import { useEffect, useState } from 'react'
import { Clock, Gem, Heart, Palette, Star } from 'lucide-react'
import { toast } from '@heroui/react'
import { useHydrated } from '@/hooks/use-hydrated'
import { cn } from '@/lib/utils'
import useAuthStore from '@/store/auth-store'
import useWishlistStore from '@/store/wishlist-store'
import type { Product } from '@/types'

const pill =
  'inline-flex items-center gap-1 rounded-full border border-border bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm'

/** "2d 4h", "3h 12m", "45s" */
export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/** Re-renders every second until `target`; returns the ms left (null without a target). */
export function useCountdown(target: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])
  return target ? new Date(target).getTime() - now : null
}

/** Drop countdown, edition count, NFT and personalization tags for a product. */
export function ProductBadges({ product, className }: { product: Product; className?: string }) {
  const hydrated = useHydrated()
  const target = product.dropStatus === 'upcoming' ? product.dropStartsAt : product.dropStatus === 'live' ? product.dropEndsAt : null
  const left = useCountdown(target)

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {hydrated && product.dropStatus === 'upcoming' && left !== null && (
        <span className={cn(pill, 'border-brand/40 text-brand')}>
          <Clock className="size-3" />
          Drops in {formatCountdown(left)}
        </span>
      )}
      {hydrated && product.dropStatus === 'live' && left !== null && (
        <span className={pill}>
          <Clock className="size-3" />
          Ends in {formatCountdown(left)}
        </span>
      )}
      {product.dropStatus === 'ended' && <span className={pill}>Drop ended</span>}
      {product.editionSize !== null && (
        <span className={cn(pill, product.editionsRemaining === 0 && 'text-muted-foreground')}>
          {product.editionsRemaining === 0 ? 'Sold out' : `${product.editionsRemaining} of ${product.editionSize} left`}
        </span>
      )}
      {product.nftBacked && (
        <span className={cn(pill, 'border-[#0098EA]/40 text-[#0098EA]')}>
          <Gem className="size-3" />
          NFT certificate
        </span>
      )}
      {product.customizable && (
        <span className={pill}>
          <Palette className="size-3" />
          Personalizable
        </span>
      )}
    </div>
  )
}

export function Stars({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)} aria-label={`${value} out of 5 stars`}>
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn('size-3', n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
        ))}
      </span>
      {count !== undefined && <span className="tabular-nums">({count})</span>}
    </span>
  )
}

/** Save-for-later heart. Asks signed-out visitors to sign in. */
export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const hydrated = useHydrated()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { ids, load, toggle } = useWishlistStore()
  const saved = hydrated && ids.has(productId)

  useEffect(() => {
    if (hydrated && isAuthenticated) load()
  }, [hydrated, isAuthenticated, load])

  const onClick = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isAuthenticated) {
      toast.warning('Sign in to save products')
      return
    }
    try {
      const nowSaved = await toggle(productId)
      toast.success(nowSaved ? 'Saved to your wishlist' : 'Removed from your wishlist')
    } catch (error) {
      toast.danger(error instanceof Error ? error.message : 'Could not update your wishlist')
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background/85 backdrop-blur-sm transition-transform hover:scale-110',
        className
      )}
    >
      <Heart className={cn('size-4', saved ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground')} />
    </button>
  )
}

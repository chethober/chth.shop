'use client'

import { motion } from 'framer-motion'
import { Calendar, Package, Share2 } from 'lucide-react'
import { toast } from '@heroui/react'
import { SocialLinks } from '@/components/shared/social-links'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import type { Artist } from '@/types'
import { useT } from '@/lib/i18n'

async function shareStore(title: string, copiedMessage: string) {
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
  toast.info(copiedMessage)
}

export function ArtistProfileCard({ artist, productCount }: { artist: Artist; productCount: number }) {
  const t = useT()
  const username = artist.user?.username ?? ''
  const displayName = artist.storeName || username
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-brand/30 via-brand/10 to-muted" />
        <div className="-mt-10 flex flex-col gap-6 px-6 pb-6 sm:px-8 sm:pb-8 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 text-center sm:items-start sm:text-left lg:w-56">
            <div className="flex size-20 items-center justify-center rounded-2xl border-4 border-card bg-muted text-2xl font-bold text-foreground shadow-sm">
              {initials}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{displayName}</h1>
              <p className="text-xs font-medium text-brand">@{username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => shareStore(t('{name} on CHTH', { name: displayName }), t('Link copied to clipboard'))}>
              <Share2 />
              {t("Share store")}
            </Button>
          </div>

          <div className="flex-1 space-y-5 lg:pt-12">
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-foreground">{t("About")}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {artist.bio || 'This artist creates unique custom merchandise and apparel.'}
              </p>
            </div>

            <SocialLinks socials={artist} />

            <div className="flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
              {artist.createdAt && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1">
                  <Calendar className="size-3.5" />
                  Joined {formatDate(artist.createdAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1">
                <Package className="size-3.5" />
                {productCount} {productCount === 1 ? 'product' : 'products'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

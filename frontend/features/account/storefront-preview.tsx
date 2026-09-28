'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { getSocialIcon } from '@/components/shared/social-icons'
import { SOCIAL_PLATFORMS } from '@/lib/social'
import { cn } from '@/lib/utils'
import type { StoreForm } from './store-form'

/** Live preview of how the storefront header will look to visitors. */
export function StorefrontPreview({ username, form }: { username: string; form: StoreForm }) {
  const socials = SOCIAL_PLATFORMS.filter(({ id }) => form[id].trim())
  const storeName = form.storeName.trim()
  const bio = form.bio.trim()
  const initials = (storeName || username || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="h-20 bg-gradient-to-br from-brand/30 via-brand/10 to-muted" />
      <div className="-mt-8 px-5 pb-5">
        <div className="flex size-16 items-center justify-center rounded-2xl border-4 border-card bg-muted text-lg font-bold text-foreground shadow-sm">
          {initials}
        </div>
        <h3 className={cn('mt-3 truncate text-lg font-bold tracking-tight', storeName ? 'text-foreground' : 'text-muted-foreground/60')}>
          {storeName || 'Your store name'}
        </h3>
        <p className="text-xs text-muted-foreground">@{username}</p>
        <p
          className={cn(
            'mt-3 line-clamp-5 whitespace-pre-line break-words text-sm leading-relaxed',
            bio ? 'text-foreground/90' : 'italic text-muted-foreground/60'
          )}
        >
          {bio || 'Your bio will appear here.'}
        </p>
        {socials.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            <AnimatePresence initial={false}>
              {socials.map((platform) => (
                <motion.span
                  key={platform.id}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  title={platform.label}
                  className="flex size-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: platform.brandHoverBg, color: platform.brandColor }}
                >
                  {getSocialIcon(platform.id, { size: 15 })}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

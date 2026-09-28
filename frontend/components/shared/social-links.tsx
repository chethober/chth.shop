'use client'

import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { SOCIAL_PLATFORMS, formatSocialDisplay, formatSocialUrl } from '@/lib/social'
import { cn } from '@/lib/utils'
import type { SocialHandles } from '@/types'
import { getSocialIcon } from './social-icons'

/** Pill links to an artist's social profiles; renders nothing when none are set. */
export function SocialLinks({ socials, className }: { socials: SocialHandles; className?: string }) {
  const links = SOCIAL_PLATFORMS.flatMap((platform) => {
    const value = socials[platform.id]?.trim()
    if (!value) return []
    return [
      {
        ...platform,
        url: formatSocialUrl(platform.id, value),
        display: formatSocialDisplay(platform.id, value),
      },
    ]
  })

  if (links.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map((link, index) => (
        <motion.a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: index * 0.03 }}
          className="group flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-muted"
        >
          <span style={{ color: link.brandColor }}>{getSocialIcon(link.id, { size: 15 })}</span>
          <span className="text-muted-foreground transition-colors group-hover:text-foreground">{link.display}</span>
          <ExternalLink className="size-3 text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100" />
        </motion.a>
      ))}
    </div>
  )
}

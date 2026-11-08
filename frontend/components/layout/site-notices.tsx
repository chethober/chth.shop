'use client'

import { useEffect, useRef, useState } from 'react'
import { bannerHtml, cookieNoticeHtml, type Announcement } from '@/chth-kit/shell.js'
import { useLocale } from '@/lib/i18n'

/**
 * The CHTH banner (set from the hub's 📢 Banners), fixed across the top. The navbar floats over
 * the page, so the banner's height goes into --chth-banner-h and the navbar moves down by it. The
 * kit's script hides it for a visitor who closed it, until the text changes.
 */
export function SiteBanner() {
  const { locale } = useLocale()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    fetch('/api/announcement')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAnnouncement(data?.announcement ?? null))
      .catch(() => {})
  }, [])
  useEffect(() => {
    const root = document.documentElement
    const el = box.current
    if (!announcement || !el) return
    // The strip's height while it's there; 0 once it's closed (or was closed before).
    const measure = () => root.style.setProperty('--chth-banner-h', `${el.querySelector('.chth-banner:not(.chth-dismissing)')?.getBoundingClientRect().height ?? 0}px`)
    const size = new ResizeObserver(measure)
    const strip = new MutationObserver(measure)
    size.observe(el)
    strip.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    measure()
    return () => { size.disconnect(); strip.disconnect(); root.style.removeProperty('--chth-banner-h') }
  }, [announcement, locale])
  if (!announcement) return null
  return <div ref={box} className="shop-banner" dangerouslySetInnerHTML={{ __html: bannerHtml(announcement, locale) }} />
}

/**
 * The CHTH cookie notice: the shop only sets essential cookies (sign-in, language, theme), so
 * it's information, not a question. Shown after hydration, so the kit's script can hide it at once
 * for anyone who already said "Got it".
 */
export function CookieNotice() {
  const { locale } = useLocale()
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  return <div className="contents" dangerouslySetInnerHTML={{ __html: cookieNoticeHtml(locale, { privacyHref: '/terms' }) }} />
}

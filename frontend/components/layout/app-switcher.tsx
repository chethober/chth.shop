'use client'

import { appSwitcherHtml } from '@/chth-kit/shell.js'
import { useLocale } from '@/lib/i18n'

/**
 * The CHTH app switcher (the kit's markup; it opens without JavaScript, the kit's script closes it).
 * With `prefs`, it also holds the language and theme for phones (in a .chth-tools--compact row).
 */
export function AppSwitcher({ className, prefs }: { className?: string; prefs?: boolean }) {
  const { locale } = useLocale()
  return <span className="contents" dangerouslySetInnerHTML={{ __html: appSwitcherHtml(locale, 'shop', { className, prefs }) }} />
}

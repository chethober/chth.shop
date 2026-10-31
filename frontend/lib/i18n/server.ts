import { cookies, headers } from 'next/headers'
import { isLocale, LOCALE_KEY, pickLocale, type Locale } from '@/chth-kit/locales.js'

/** The language for the first render: the chth_lang cookie, else the Accept-Language header. */
export async function requestLocale(): Promise<{ locale: Locale; hasCookie: boolean }> {
  const cookie = (await cookies()).get(LOCALE_KEY)?.value
  if (isLocale(cookie)) return { locale: cookie, hasCookie: true }
  return { locale: pickLocale([(await headers()).get('accept-language')]), hasCookie: false }
}

import { redirect } from 'next/navigation'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** Legacy URL: forwards to the sign-in page, keeping any query (e.g. `?error=`). */
export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') params.set(key, value)
  }
  redirect(params.size ? `/auth?${params}` : '/auth')
}

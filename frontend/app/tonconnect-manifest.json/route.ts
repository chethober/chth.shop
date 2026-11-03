import { NextResponse, type NextRequest } from 'next/server'

/** TON Connect app manifest for whichever origin the site is served from. */
export function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host
  const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '')
  const origin = `${proto}://${host}`
  return NextResponse.json(
    {
      url: origin,
      name: 'CHTH',
      iconUrl: `${origin}/logo-black.png`,
      termsOfUseUrl: `${origin}/terms`,
    },
    { headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } }
  )
}

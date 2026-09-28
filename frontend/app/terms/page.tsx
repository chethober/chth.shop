import type { Metadata } from 'next'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/page-container'
import { TermsScroller } from '@/components/custom/terms-scroller'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TERMS, TERMS_EFFECTIVE_DATE, TERMS_VERSION } from '@/features/terms/terms-content'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review the Terms of Service governing your use of CHTH, including our 3D apparel customizer, artist collaboration, and made-to-order merchandise fulfillment.',
}

export default function TermsPage() {
  return (
    <PageContainer className="max-w-7xl">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-6">
        <Badge variant="success">
          <span className="size-1.5 animate-pulse rounded-full bg-current" />
          Effective {TERMS_EFFECTIVE_DATE}
        </Badge>
        <span className="text-[11px] text-muted-foreground">Version {TERMS_VERSION}</span>
      </div>

      <TermsScroller title="Terms of Service" terms={TERMS} className="px-0 py-4" />

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <p className="text-center text-xs text-muted-foreground sm:text-left">
          Ready to continue designing custom merchandise?
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button asChild variant="outline" className="flex-1 sm:flex-none">
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button asChild className="flex-1 sm:flex-none">
            <Link href="/design">Open 3D studio</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

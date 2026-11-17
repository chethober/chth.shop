import type { Metadata } from 'next'
import Link from 'next/link'
import { PageContainer } from '@/components/layout/page-container'
import { TermsScroller } from '@/components/custom/terms-scroller'
import { Eyebrow } from '@/components/shared/eyebrow'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { TERMS, TERMS_EFFECTIVE_DATE, TERMS_VERSION } from '@/features/terms/terms-content'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Review the Terms of Service governing your use of CHTH, including our 3D apparel customizer, artist collaboration, and made-to-order merchandise fulfillment.',
}

export default function TermsPage() {
  return (
    <PageContainer className="gap-6">
      <PageHeader
        className="mb-0 sm:mb-0"
        eyebrow={<Eyebrow>Effective {TERMS_EFFECTIVE_DATE} · Version {TERMS_VERSION}</Eyebrow>}
        title="Terms of Service"
        description="How CHTH works for buyers, artists and merchants: accounts, the 3D studio, your designs, orders and payouts."
      />

      <TermsScroller terms={TERMS} />

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-muted/40 p-5 sm:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-left">Ready to make something?</p>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button asChild variant="outline">
            <Link href="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/design">Open 3D studio</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  )
}

export const AGREEMENT_VERSION = 'SELLER-v3.0'

export const AGREEMENT_NOTICE =
  'NOTICE: Review the partnership conditions below. By accepting, you open a CHTH store as an artist or merchant under non-exclusive licensing terms.'

export const AGREEMENT_CLAUSES: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Scope & License Grant',
    body: 'Seller grants CHTH a non-exclusive, worldwide, revocable license to reproduce, market, produce, and fulfill garments and merchandise featuring submitted artworks, logos, and brand marks. The Seller retains 100% intellectual property ownership of all submitted designs.',
  },
  {
    title: '2. Royalties & Settlement',
    body: (
      <>
        Sellers set their own retail price, never below the production cost. For every unit sold you earn{' '}
        <strong className="text-foreground">75% of the margin</strong> (retail price minus production cost); CHTH
        keeps 25% as its platform fee. Buyers pay in crypto, sales update live in your store dashboard, and payouts
        are sent monthly to the crypto payout address on your store.
      </>
    ),
  },
  {
    title: '3. Production & Fulfillment',
    body: 'CHTH finances 100% of garment blank inventory, screen/DTG printing, quality assurance, packaging, worldwide shipping, and customer support. Seller bears zero out-of-pocket production costs or inventory holding risk.',
  },
  {
    title: '4. Originality & IP Warranties',
    body: 'Seller certifies and warrants that all submitted graphics, logos, and artwork are original works created by the seller or that the seller possesses all lawful rights and permissions required to commercialize them without infringing third-party rights.',
  },
  {
    title: '5. Term & Termination',
    body: 'Either party may terminate this collaboration agreement at any time with 14 calendar days written notice. Upon termination, CHTH will fulfill any active customer orders, remit outstanding earnings, and delist the designs.',
  },
]

export const AGREEMENT_FOOTNOTE = 'Document Revision: 2026.1 // Applicable across all CHTH commercial storefronts.'

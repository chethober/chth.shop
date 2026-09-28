export const AGREEMENT_VERSION = 'COLLAB-v2.4'

export const AGREEMENT_NOTICE =
  'NOTICE: Review the partnership conditions below. By accepting, you join the CHTH artist collective under non-exclusive licensing terms.'

export const AGREEMENT_CLAUSES: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Scope & License Grant',
    body: 'Artist grants CHTH a non-exclusive, worldwide, revocable license to reproduce, market, produce, and fulfill garments and merchandise featuring submitted artworks. The Artist retains 100% intellectual property and copyright ownership of all submitted original designs.',
  },
  {
    title: '2. Royalties & Settlement',
    body: (
      <>
        Artists receive a standard <strong className="text-foreground">25% royalty</strong> on the net sale price of
        every merchandise unit sold bearing their artwork. Royalty metrics update live in the artist portal, with
        payouts scheduled monthly via connected payout rail (Bank, Stripe, or Crypto).
      </>
    ),
  },
  {
    title: '3. Production & Fulfillment',
    body: 'CHTH finances 100% of garment blank inventory, screen/DTG printing, quality assurance, packaging, worldwide shipping, and customer support. Artist bears zero out-of-pocket production costs or inventory holding risk.',
  },
  {
    title: '4. Originality & IP Warranties',
    body: 'Artist certifies and warrants that all submitted graphics, logos, and artwork are original works created by the artist or that the artist possesses all lawful rights and permissions required to commercialize them without infringing third-party rights.',
  },
  {
    title: '5. Term & Termination',
    body: 'Either party may terminate this collaboration agreement at any time with 14 calendar days written notice. Upon termination, CHTH will fulfill any active customer orders, remit outstanding royalties, and delist the designs.',
  },
]

export const AGREEMENT_FOOTNOTE = 'Document Revision: 2026.1 // Applicable across all CHTH commercial storefronts.'

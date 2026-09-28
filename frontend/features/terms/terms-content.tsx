// Terms of Service text, one entry per section.
import { CheckCircle2, ExternalLink, Sparkles, Mail } from 'lucide-react'
import type { TermItem } from '@/components/custom/terms-scroller'

export const TERMS_EFFECTIVE_DATE = 'September 2026'
export const TERMS_VERSION = '1.2'

export const TERMS: TermItem[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: (
      <div className="space-y-3">
        <p>
          These Terms of Service (&quot;Terms&quot;, &quot;Agreement&quot;) constitute a legally binding agreement
          between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and CHTH (&quot;CHTH&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
          governing your access to and use of our web application located at{' '}
          <span className="font-mono text-foreground font-medium">chth.shop</span> and related services, including our 3D custom apparel customizer, artist community marketplace, and fulfillment platform.
        </p>
        <p>
          By registering for an account, accessing our site, using the design tool, or placing an order,
          you agree to be bound by these Terms and our associated policies. If you do not agree to these Terms,
          you must immediately cease using the platform.
        </p>
      </div>
    ),
  },
  {
    id: 'accounts',
    title: '2. Accounts & Social Authentication',
    content: (
      <div className="space-y-3">
        <p>
          To access certain features such as saving 3D garment drafts, submitting artist portfolios,
          and tracking orders, you must authenticate through one of our supported third-party OAuth
          providers (Google, X / Twitter, or Telegram via CHTH Management Bot).
        </p>
        <ul className="space-y-2 pl-4 list-disc marker:text-muted-foreground/60">
          <li>
            <strong className="text-foreground">Eligibility:</strong> You must be at least 13 years of age (or the age of majority in your jurisdiction) to establish an account and enter transactions.
          </li>
          <li>
            <strong className="text-foreground">Account Security:</strong> You are responsible for maintaining the confidentiality and security of your OAuth access tokens and linked devices. You agree to immediately notify us of any unauthorized use or security breach.
          </li>
          <li>
            <strong className="text-foreground">Accurate Information:</strong> You agree to provide accurate, up-to-date shipping and billing details when finalizing transactions.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'studio-uploads',
    title: '3. 3D Studio & Content Uploads',
    content: (
      <div className="space-y-3">
        <p>
          Our 3D customizer allows you to upload artwork, position graphics, tweak colors, and visualize
          garments on virtual 3D models in real time before placing an order.
        </p>
        <div className="p-4 rounded-xl bg-card border border-border text-xs sm:text-sm space-y-1.5">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand" />
            3D Simulation vs. Physical Apparel
          </span>
          <p className="text-muted-foreground leading-relaxed">
            While our real-time 3D renderer simulates fabric draping, textures, and lighting as accurately as possible, slight natural variances may occur between computer displays (RGB color profiles, screen calibration) and the finished physical garment (CMYK screen and direct-to-garment pigment printing).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'artist-rights',
    title: '4. Artist Intellectual Property & Royalties',
    content: (
      <div className="space-y-3">
        <p>
          CHTH is built to empower creators. We respect and champion artist rights:
        </p>
        <ul className="space-y-2 pl-4 list-disc marker:text-muted-foreground/60">
          <li>
            <strong className="text-foreground">Artist Retains 100% Ownership:</strong> By uploading your artwork or publishing a collection, you retain all copyrights, trademarks, and intellectual property rights in your original art.
          </li>
          <li>
            <strong className="text-foreground">Limited Manufacturing License:</strong> You grant CHTH a non-exclusive, worldwide, royalty-bearing license solely to manufacture, fulfill, promote, and distribute products bearing your design in accordance with the Artist Collaboration Agreement.
          </li>
          <li>
            <strong className="text-foreground">Royalty Payouts:</strong> Verified artists receive transparent royalty payouts calculated on net merchandise sales, accessible via their account dashboard.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'orders-pricing',
    title: '5. Orders, Pricing & Payment',
    content: (
      <div className="space-y-3">
        <p>
          All prices listed on the site are subject to change without prior notice. Applicable shipping fees,
          taxes, and duties will be calculated and displayed during the checkout process before payment authorization.
        </p>
        <p>
          Payment must be made in full through our authorized payment processors prior to the commencement of apparel production. By placing an order, you represent that you are authorized to use the chosen payment method.
        </p>
      </div>
    ),
  },
  {
    id: 'fulfillment-shipping',
    title: '6. Production, Shipping & Customs',
    content: (
      <div className="space-y-3">
        <p>
          Because items are custom-printed and sewn to order, orders typically require an estimated 3 to 7 business days for manufacturing before shipment.
        </p>
        <ul className="space-y-2 pl-4 list-disc marker:text-muted-foreground/60">
          <li>
            <strong className="text-foreground">Fulfillment Timelines:</strong> Estimated shipping dates are provided as guidelines, not absolute guarantees. Unforeseen courier delays or weather disruptions may occasionally extend delivery times.
          </li>
          <li>
            <strong className="text-foreground">International Customs & Import Taxes:</strong> Shipments delivered outside the originating region may be subject to customs duties, tariffs, and taxes levied by the destination country, which remain the recipient&apos;s responsibility.
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'returns-refunds',
    title: '7. Returns, Reprints & Quality Guarantee',
    content: (
      <div className="space-y-3">
        <p>
          Due to the personalized, made-to-order nature of custom merchandise, we do not accept general returns or buyer&apos;s remorse size exchanges. However, we proudly stand behind our craftsmanship:
        </p>
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span>CHTH Quality Guarantee</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            If an item arrives with manufacturing defects, significant print misalignments, damaged textiles, or was damaged during transit, contact us within 14 days of delivery with photos of the issue. We will expedite a free replacement reprint or issue a full refund immediately.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'copyright-dmca',
    title: '8. Copyright & DMCA Policy',
    content: (
      <div className="space-y-3">
        <p>
          We strictly respect intellectual property rights and enforce a zero-tolerance policy against intentional infringement. Users may not upload or produce goods featuring logos, trademarks, copyrighted illustrations, or likenesses without explicit written authorization from the rightsholder.
        </p>
        <p>
          If you believe that your intellectual property is being infringed on our platform, please submit a formal notice to our designated copyright team at{' '}
          <span className="font-mono text-foreground font-medium">legal@chth.wtf</span> including documentation of the copyrighted work and proof of ownership.
        </p>
      </div>
    ),
  },
  {
    id: 'conduct',
    title: '9. Prohibited Conduct & Community Rules',
    content: (
      <div className="space-y-3">
        <p>You agree not to use CHTH to create, upload, or transmit content that:</p>
        <ul className="space-y-2 pl-4 list-disc marker:text-muted-foreground/60">
          <li>Promotes hate speech, violent extremism, defamation, or discrimination against protected groups;</li>
          <li>Contains non-consensual imagery, sexually explicit material, or child exploitation;</li>
          <li>Attempts to probe, scan, or reverse-engineer our 3D rendering pipeline or backend API infrastructure;</li>
          <li>Interferes with legitimate commerce or launches automated scraping bots.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'disclaimers',
    title: '10. Warranties & Disclaimers',
    content: (
      <div className="space-y-3">
        <p className="uppercase text-xs font-mono tracking-wider text-muted-foreground font-semibold">
          AS-IS Disclaimer
        </p>
        <p>
          The platform, services, and software are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.
        </p>
      </div>
    ),
  },
  {
    id: 'liability',
    title: '11. Limitation of Liability',
    content: (
      <div className="space-y-3">
        <p>
          To the maximum extent permitted by applicable law, CHTH and its officers, employees, and suppliers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses arising from your use of the service.
        </p>
      </div>
    ),
  },
  {
    id: 'termination',
    title: '12. Termination & Modifications',
    content: (
      <div className="space-y-3">
        <p>
          We reserve the right to modify these Terms at any time. When substantial changes are made, we will update the version number and effective date at the top of this document. Continued use of the platform following the posting of updated Terms constitutes your acceptance.
        </p>
        <p>
          We may terminate or suspend your account privileges without notice if you breach any term of this Agreement or engage in unauthorized activities.
        </p>
      </div>
    ),
  },
  {
    id: 'contact',
    title: '13. Contact & Inquiries',
    content: (
      <div className="space-y-4">
        <p>
          If you have questions, inquiries, or legal notifications concerning these Terms of Service, you can reach out to our team:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href="mailto:legal@chth.wtf"
            className="p-3.5 rounded-xl border border-border bg-card hover:bg-secondary/40 transition-colors flex items-center gap-3 group"
          >
            <Mail className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
            <div>
              <p className="text-xs font-semibold text-foreground">Legal Team</p>
              <p className="text-[11px] text-muted-foreground">legal@chth.wtf</p>
            </div>
          </a>

          <a
            href="https://chth.wtf"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-border bg-card hover:bg-secondary/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4 text-brand group-hover:scale-110 transition-transform" />
              <div>
                <p className="text-xs font-semibold text-foreground">Official Website</p>
                <p className="text-[11px] text-muted-foreground">chth.wtf</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    ),
  },
];

'use client'

import Link from 'next/link'
import { ShoppingBag, Github, Twitter, Instagram, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Platform',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Design Studio', href: '/design' },
        { name: 'Artist Collaboration', href: '/collab' },
        { name: 'Browse Products', href: '/products' },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help' },
        { name: 'Contact Us', href: '/contact' },
        { name: 'Shipping Info', href: '/shipping' },
        { name: 'Returns', href: '/returns' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '/privacy' },
        { name: 'Terms of Service', href: '/terms' },
        { name: 'Artist Agreement', href: '/artist-terms' },
        { name: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ]

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/chethober', icon: Github },
    { name: 'Twitter', href: 'https://x.com/chethober', icon: Twitter },
    { name: 'Instagram', href: 'https://www.instagram.com/chethober/', icon: Instagram },
            { name: 'Email', href: 'mailto:shop@chth.xyz', icon: Mail },
  ]

  return (
    <footer className="footer-gradient border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="col-span-1 lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <img src="/logo-white.png" alt="CHTH Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-foreground">CHTH | چث</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create and customize your own merchandise with our innovative 3D design platform.
                Collaborate with artists and bring your ideas to life.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title} className="col-span-1">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              © {currentYear} CHTH | چث. All rights reserved.
            </div>

            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <span>Made with ❤️ for creators</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

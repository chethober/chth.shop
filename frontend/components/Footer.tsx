'use client'

import Link from 'next/link'
import { ShoppingBag, Github, Twitter, Instagram, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()



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
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Brand Section */}
            <div className="flex flex-col items-center">
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <img src="/logo-white.png" alt="CHTH Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-foreground">CHTH | چث</span>
              </Link>

              
              {/* Persian Text */}
              <p className="text-lg font-medium text-foreground mb-6 font-['Noto_Nastaliq_Urdu',serif]">
                کیفیت هر چیز به جنسشه، حتی آدما
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
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border">
          <div className="flex justify-center">
            <div className="text-sm text-muted-foreground">
              © {currentYear} CHTH | چث. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

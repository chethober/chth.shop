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
    <footer className="w-full border-t border-border/30 glass backdrop-blur-xl mt-20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-6">
        {/* Brand Section */}
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center space-x-2 mb-4 group">
            <img src="/logo-white.png" alt="CHTH Logo" className="h-8 w-auto transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold tracking-tight text-foreground">CHTH <span className="text-xs opacity-60 font-normal">| چث</span></span>
          </Link>

          {/* Persian Text */}
          <p className="text-base sm:text-lg font-medium text-muted-foreground mb-6 max-w-md font-['Noto_Nastaliq_Urdu',serif]">
            کیفیت هر چیز به جنسشه، حتی آدما
          </p>

          {/* Social Links */}
          <div className="flex space-x-3">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                className="p-3 rounded-full glass-pill hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all duration-300 shadow-sm"
                aria-label={social.name}
              >
                <social.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="w-full mt-8 pt-6 border-t border-border/30 text-center">
          <div className="text-xs font-medium text-muted-foreground">
            © {currentYear} CHTH | چث. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

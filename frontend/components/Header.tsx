'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, User, ShoppingBag, Palette, Users, Home, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check initial theme from document class
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { name: 'About', href: '/#about', icon: Home },
    { name: 'Collab', href: '/#collab', icon: Users },
    { name: 'Design', href: '/#design', icon: Palette },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '')
      if (pathname === '/') {
        e.preventDefault()
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
          window.history.replaceState(null, '', `#${sectionId}`)
        }
      }
    }
    setIsMenuOpen(false)
  }

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto transition-all duration-300">
      <div className="glass-pill px-4 sm:px-6 h-14 flex items-center justify-between shadow-lg">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <img 
            src="/logo-white.png" 
            alt="CHTH Logo" 
            className={cn("h-7 w-auto transition-transform duration-300 group-hover:scale-105", !isDark && "invert")} 
          />
          <span className="text-lg font-bold tracking-tight text-foreground">CHTH <span className="text-xs opacity-60 font-normal">| چث</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                'nav-link flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-all duration-200',
                isActive(item.href) ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-foreground/10 text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right Icons (Desktop) */}
        <div className="hidden md:flex items-center space-x-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full hover:bg-foreground/10"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link 
            href="/cart" 
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full hover:bg-foreground/10"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="h-4 w-4" />
          </Link>
          <Link 
            href="/account" 
            className="p-2 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-full hover:bg-foreground/10"
            aria-label="User profile"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>

          {/* Mobile menu button and quick icons */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link 
              href="/cart" 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  'nav-link flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors w-full',
                  isActive(item.href) && 'nav-link active bg-accent text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="pt-4 mt-4 border-t border-border">
              <Link
                href="/account"
                onClick={() => setIsMenuOpen(false)}
                className="nav-link flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors w-full"
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header

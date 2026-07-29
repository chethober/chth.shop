'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Sparkles, 
  Palette, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Shirt, 
  Zap, 
  Star,
  Layers,
  Compass,
  CheckCircle2
} from 'lucide-react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { cn, getProductTypeLabel, generatePlaceholderImage } from '@/lib/utils'
import { ProductType } from '@/types'

const HomePage = () => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [activeSection, setActiveSection] = useState('about')
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll animations setup
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })

  // Background glow parallax transformations
  const orb1Y = useTransform(scrollYProgress, [0, 1], ['0%', '120%'])
  const orb2Y = useTransform(scrollYProgress, [0, 1], ['0%', '-80%'])
  const scaleHero = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])
  const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0.6])

  // Sample product data for preview
  const featuredProducts = [
    {
      id: '1',
      name: 'Galaxy Dreams Tee',
      type: 'tshirt' as ProductType,
      price: 29.99,
      imageUrl: generatePlaceholderImage(400, 400, 'Galaxy Tee'),
      artist: { user: { username: 'cosmic_artist' } }
    },
    {
      id: '2',
      name: 'Urban Vibes Hoodie',
      type: 'hoodie' as ProductType,
      price: 59.99,
      imageUrl: generatePlaceholderImage(400, 400, 'Urban Hoodie'),
      artist: { user: { username: 'street_designer' } }
    },
    {
      id: '3',
      name: 'Comfort Zone Pants',
      type: 'pants' as ProductType,
      price: 45.99,
      imageUrl: generatePlaceholderImage(400, 400, 'Comfort Pants'),
      artist: { user: { username: 'minimal_studio' } }
    }
  ]

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % featuredProducts.length)
  }

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)
  }

  // Auto-scroll products
  useEffect(() => {
    const interval = setInterval(nextProduct, 5000)
    return () => clearInterval(interval)
  }, [])

  // Handle scroll section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'collab', 'design']
      const scrollPosition = window.scrollY + window.innerHeight / 3

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(sectionId)
    }
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background overflow-hidden font-sans">
      


      {/* Ambient Animated Greyscale Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div 
          style={{ y: orb1Y }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          className="absolute -top-40 left-1/4 w-[550px] h-[550px] bg-foreground/5 rounded-full blur-[140px]" 
        />
        <motion.div 
          style={{ y: orb2Y }}
          animate={{ scale: [1.1, 0.95, 1.1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
          className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-foreground/5 rounded-full blur-[160px]" 
        />
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-foreground/5 rounded-full blur-[150px]" 
        />
      </div>

      {/* Hero Section */}
      <section id="about" className="relative min-h-screen flex items-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div 
            style={{ scale: scaleHero, opacity: opacityHero }}
            className="grid lg:grid-cols-12 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold tracking-wide text-primary shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Merch Studio</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl sm:text-6xl xl:text-7xl font-extrabold text-foreground tracking-tight leading-[1.08]"
              >
                Design without <br />
                <span className="text-gradient">boundaries.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed text-balance"
              >
                Craft, customize, and monetize premium custom merchandise in real-time 3D. Designed for modern creators and visionary artists.
              </motion.p>

              {/* Highlighted Glowing Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <Link href="/design" className="btn-highlight group w-full sm:w-auto">
                  <span>Start Designing</span>
                  <ArrowRight className="ml-2.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link href="/collab" className="btn-glass-pill w-full sm:w-auto">
                  <span>Join as Artist</span>
                </Link>
              </motion.div>

              {/* Key Features Badges */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="pt-6 grid grid-cols-3 gap-4 border-t border-border/40 max-w-md mx-auto lg:mx-0"
              >
                {[
                  { icon: Palette, label: '3D Studio' },
                  { icon: Users, label: 'Artist Hub' },
                  { icon: Sparkles, label: 'Pro Quality' }
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <feat.icon className="w-4 h-4 text-primary shrink-0" />
                    <span>{feat.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Side - Floating Glass Showcase Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-5 relative"
            >
              <div className="glass-card-rounded p-6 sm:p-8 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Featured Preview</span>
                </div>

                {/* Animated Carousel Item */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProductIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4 text-center"
                  >
                    <div className="relative w-full aspect-square max-w-[260px] mx-auto rounded-2xl overflow-hidden glass p-4 shadow-inner">
                      <Image
                        src={featuredProducts[currentProductIndex].imageUrl}
                        alt={featuredProducts[currentProductIndex].name}
                        fill
                        className="object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {featuredProducts[currentProductIndex].name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        By <span className="text-primary font-medium">@{featuredProducts[currentProductIndex].artist.user.username}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-2xl font-black text-foreground">
                        ${featuredProducts[currentProductIndex].price}
                      </span>
                      <Link
                        href={`/${featuredProducts[currentProductIndex].artist.user.username}`}
                        className="btn-glass-pill text-xs px-4 py-2"
                      >
                        View Store
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Carousel Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
                  <button
                    onClick={prevProduct}
                    className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all"
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex space-x-1.5">
                    {featuredProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentProductIndex(idx)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          idx === currentProductIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                        )}
                        aria-label={`Go to item ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextProduct}
                    className="p-2 rounded-full hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-all"
                    aria-label="Next product"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Artist Network Section */}
      <section id="collab" className="relative py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-12 gap-12 items-center"
          >
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold tracking-wide text-primary">
                <Users className="w-3.5 h-3.5" />
                <span>Artist Network</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Turn your art into <br />
                <span className="text-gradient">thriving merchandise.</span>
              </h2>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Join our curated artist collective. Publish your creative work, set your royalty terms, and let us handle production and fulfillment worldwide.
              </p>

              <div className="space-y-4">
                {[
                  { title: '25% Royalty Rate', desc: 'Highest payout structure for independent creators.' },
                  { title: 'Automated Fulfillment', desc: 'Zero inventory management or shipping headaches.' },
                  { title: 'Global Reach', desc: 'Deliver custom merch to fans across the globe.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl glass hover:bg-foreground/5 transition-all">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link href="/account" className="btn-highlight inline-flex">
                  Become a Partner
                </Link>
              </div>
            </div>

            {/* Right Side - Glass Stats Grid */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              {[
                { number: '25%', label: 'Commission Rate', icon: Star },
                { number: '24/7', label: 'Support & Analytics', icon: Zap },
                { number: '100%', label: 'Quality Guarantee', icon: Shirt },
                { number: '∞', label: 'Design Uploads', icon: Layers }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="glass-card-rounded p-6 text-center hover:scale-[1.03] transition-transform duration-300"
                >
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-3 opacity-80" />
                  <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Design Studio Showcase */}
      <section id="design" className="relative py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-12 gap-12 items-center"
          >
            {/* Left Interactive Glass Preview Box */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="glass-card-rounded p-8 relative">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden glass flex flex-col items-center justify-center border border-white/20">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                    <Compass className="w-10 h-10 text-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground">Interactive 3D Editor</span>
                  <span className="text-xs text-muted-foreground mt-1">Real-Time Texture & Shader Rendering</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  {['T-Shirts', 'Hoodies', 'Pants'].map((type, idx) => (
                    <div key={idx} className="glass p-3 rounded-2xl text-center">
                      <Shirt className="w-5 h-5 text-primary mx-auto mb-1" />
                      <span className="text-xs font-medium text-foreground">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold tracking-wide text-primary">
                <Palette className="w-3.5 h-3.5" />
                <span>3D Design Studio</span>
              </div>

              <h2 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Intuitive 3D canvas for <br />
                <span className="text-gradient">seamless creation.</span>
              </h2>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Visualize your artwork live on high-resolution 3D garments. Switch styles, rotate angles, adjust placement, and test colors instantly.
              </p>

              <div className="pt-2">
                <Link href="/design" className="btn-highlight inline-flex group">
                  <span>Launch Design Studio</span>
                  <ArrowRight className="ml-2.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Minimal CTA Banner */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="glass-card-rounded p-10 sm:p-16 text-center space-y-8 relative overflow-hidden"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                Ready to bring your ideas to life?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground">
                Join thousands of creators shaping the future of custom apparel.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register" className="btn-highlight w-full sm:w-auto">
                Create Free Account
              </Link>
              <Link href="/design" className="btn-glass-pill w-full sm:w-auto">
                Try Design Studio
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

export default HomePage

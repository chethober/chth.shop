'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Palette, Users, ChevronLeft, ChevronRight, Shirt, Zap, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn, getProductTypeLabel, generatePlaceholderImage } from '@/lib/utils'
import { ProductType } from '@/types'

const HomePage = () => {
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [activeSection, setActiveSection] = useState('about')

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

  const features = [
    {
      icon: Palette,
      title: '3D Design Studio',
      description: 'Create stunning designs with our interactive 3D editor'
    },
    {
      icon: Users,
      title: 'Artist Collaboration',
      description: 'Connect with talented artists and bring ideas to life'
    },
    {
      icon: Sparkles,
      title: 'Premium Quality',
      description: 'High-quality materials and professional printing'
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

  // Handle scroll and update URL fragments
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['about', 'collab', 'design']
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            window.history.replaceState(null, '', `#${section}`)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle initial URL fragment
  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && ['about', 'collab', 'design'].includes(hash)) {
      setActiveSection(hash)
      const element = document.getElementById(hash)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveSection(sectionId)
      window.history.replaceState(null, '', `#${sectionId}`)
    }
  }

  return (
    <div className="min-h-screen">


      {/* About Section */}
      <section id="about" className="hero-gradient relative overflow-hidden min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 py-20 lg:py-32 items-center">
            {/* Left Side - Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create. Customize. Collaborate.
                </motion.div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Design Your
                  <span className="text-gradient block">
                    Perfect Merch
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-lg text-balance">
                  Bring your creative vision to life with our cutting-edge 3D design platform.
                  Create custom merchandise that stands out from the crowd.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/design" className="btn-primary text-lg px-8 py-3 group">
                  Start Designing
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/collab" className="btn-outline text-lg px-8 py-3">
                  Join as Artist
                </Link>
              </div>

              {/* Features */}
              <div className="grid sm:grid-cols-3 gap-6 pt-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="text-center sm:text-left"
                  >
                    <feature.icon className="h-8 w-8 text-primary mb-3 mx-auto sm:mx-0" />
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Product Carousel */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  Featured Products
                </h2>

                {/* Product Carousel */}
                <div className="relative overflow-hidden rounded-xl">
                  <div className="flex transition-transform duration-500 ease-in-out"
                       style={{ transform: `translateX(-${currentProductIndex * 100}%)` }}>
                    {featuredProducts.map((product) => (
                      <div key={product.id} className="w-full flex-shrink-0">
                        <div className="product-card bg-card rounded-xl p-6 text-center">
                          <div className="relative mb-4 mx-auto w-48 h-48 rounded-lg overflow-hidden">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>

                          <h3 className="text-lg font-semibold text-card-foreground mb-2">
                            {product.name}
                          </h3>

                          <p className="text-sm text-muted-foreground mb-2">
                            {getProductTypeLabel(product.type)} by @{product.artist.user.username}
                          </p>

                          <p className="text-xl font-bold text-primary mb-4">
                            ${product.price}
                          </p>

                          <Link
                            href={`/${product.artist.user.username}`}
                            className="btn-outline w-full"
                          >
                            View Store
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Carousel Controls */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={prevProduct}
                    className="btn-ghost p-2 rounded-full"
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <div className="flex space-x-2">
                    {featuredProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentProductIndex(index)}
                        className={cn(
                          "w-3 h-3 rounded-full transition-colors",
                          index === currentProductIndex ? "bg-primary" : "bg-muted"
                        )}
                        aria-label={`Go to product ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextProduct}
                    className="btn-ghost p-2 rounded-full"
                    aria-label="Next product"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Collab Section */}
      <section id="collab" className="py-20 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  <Users className="w-4 h-4 mr-2" />
                  Artist Collaboration
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Join Our
                  <span className="text-gradient block">
                    Artist Network
                  </span>
                </h2>

                <p className="text-xl text-muted-foreground max-w-lg text-balance">
                  Connect with a community of talented artists and creators. 
                  Share your designs, collaborate on projects, and build your brand.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Premium Artist Program</h3>
                    <p className="text-muted-foreground">Get exclusive access to advanced design tools and priority support.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Revenue Sharing</h3>
                    <p className="text-muted-foreground">Earn competitive commissions on every product sold through your designs.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Quality Control</h3>
                    <p className="text-muted-foreground">We handle production, shipping, and customer service so you can focus on creating.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/account" className="btn-primary text-lg px-8 py-3">
                  Setup Artist Account
                </Link>
                <Link href="/register" className="btn-outline text-lg px-8 py-3">
                  Learn More
                </Link>
              </div>
            </motion.div>

            {/* Right Side - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground mb-4">Artist Benefits</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-card">
                        <div className="text-3xl font-bold text-primary mb-2">25%</div>
                        <div className="text-sm text-muted-foreground">Commission Rate</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-card">
                        <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                        <div className="text-sm text-muted-foreground">Support</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-card">
                        <div className="text-3xl font-bold text-primary mb-2">∞</div>
                        <div className="text-sm text-muted-foreground">Designs</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-card">
                        <div className="text-3xl font-bold text-primary mb-2">100%</div>
                        <div className="text-sm text-muted-foreground">Quality</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Design Section */}
      <section id="design" className="py-20 min-h-screen flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Palette className="w-4 h-4 mr-2" />
                  3D Design Studio
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Create with
                  <span className="text-gradient block">
                    Precision
                  </span>
                </h2>

                <p className="text-xl text-muted-foreground max-w-lg text-balance">
                  Our advanced 3D design tool lets you visualize your creations in real-time.
                  Switch between products, customize colors, and preview your designs instantly.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shirt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Multiple Products</h3>
                    <p className="text-muted-foreground">Design for T-shirts, Hoodies, and Pants with seamless switching.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Palette className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Instant Preview</h3>
                    <p className="text-muted-foreground">See your designs come to life with our real-time 3D rendering.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/design" className="btn-primary text-lg px-8 py-3 group">
                  Launch Design Studio
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/account" className="btn-outline text-lg px-8 py-3">
                  View My Designs
                </Link>
              </div>
            </motion.div>

            {/* Right Side - 3D Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground mb-6">3D Design Preview</h3>
                    <div className="relative w-64 h-64 mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Palette className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">Interactive 3D Model</p>
                          <p className="text-sm text-muted-foreground">Click to explore</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-card">
                        <Shirt className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">T-shirts</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-card">
                        <Shirt className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Hoodies</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-card">
                        <Shirt className="w-6 h-6 text-primary mx-auto mb-2" />
                        <div className="text-sm text-muted-foreground">Pants</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ready to Create Something Amazing?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of creators who are already designing and selling custom merchandise
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link href="/design" className="btn-outline text-lg px-8 py-3">
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

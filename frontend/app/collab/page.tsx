'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Check, ArrowRight, Users, Palette, DollarSign, Shield, Sparkles } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

const CollabPage = () => {
  const [isAccepting, setIsAccepting] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const handleAcceptContract = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to accept the contract')
      router.push('/auth?redirect=/collab')
      return
    }

    setIsAccepting(true)
    try {
      await api.acceptContract()
      toast.success('Welcome to the CHTH | چث Artist Program!')
      router.push('/account')
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept contract')
    } finally {
      setIsAccepting(false)
    }
  }

  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Revenue Split',
      description: '70% of net sales go directly to you, with transparent reporting'
    },
    {
      icon: Palette,
      title: 'Creative Freedom',
      description: 'Full creative control over your designs and brand identity'
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Join our active community of artists and get featured'
    },
    {
      icon: Shield,
      title: 'IP Protection',
      description: 'Your designs are protected and you retain full ownership'
    }
  ]

  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-sans pt-20">
      
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/3 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-foreground/5 rounded-full blur-[160px]" />
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-pill text-xs font-semibold tracking-wide text-primary shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Artist Collaboration Program</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
              Join Our <br />
              <span className="text-gradient">Creative Collective</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Partner with CHTH | چث to showcase your art on premium merchandise.
              Earn revenue, build your brand, and reach a global audience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={handleAcceptContract}
                disabled={isAccepting}
                className={cn(
                  'btn-highlight group w-full sm:w-auto',
                  isAccepting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isAccepting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <span>Accept & Join Now</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <Link href="#contract" className="btn-glass-pill w-full sm:w-auto">
                Read Agreement
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16 space-y-3"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Why Partner With Us?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide everything you need to turn your creativity into a thriving brand.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card-rounded p-6 text-center hover:scale-[1.03] transition-transform duration-300"
              >
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                  <benefit.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Section */}
      <section id="contract" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass-card-rounded p-8 sm:p-12 relative"
          >
            <div className="text-center mb-8 space-y-2">
              <FileText className="h-10 w-10 text-primary mx-auto mb-2" />
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                Artist Partnership Agreement
              </h2>
              <p className="text-xs text-muted-foreground">
                Please read through our partnership terms below before signing
              </p>
            </div>

            <div className="glass p-6 rounded-2xl mb-8">
              <div
                className="prose prose-invert max-w-none space-y-6 text-foreground max-h-96 overflow-y-auto pr-4 text-sm leading-relaxed"
                onScroll={(e) => {
                  const element = e.target as HTMLDivElement
                  const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100
                  if (scrollPercentage > 80) {
                    setHasScrolled(true)
                  }
                }}
              >
                <h3 className="text-base font-bold text-primary mb-2">1. Partnership Overview</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This Artist Partnership Agreement establishes a collaborative relationship
                  between you ("Artist") and CHTH | چث for the creation, promotion, and
                  sale of custom merchandise featuring your original artwork.
                </p>

                <h3 className="text-base font-bold text-primary mb-2">2. Revenue Sharing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Artists receive 70% of net sales revenue from products featuring their designs.
                  Net sales are calculated after deducting payment processing fees, returns, and
                  production costs. Payments are processed monthly.
                </p>

                <h3 className="text-base font-bold text-primary mb-2">3. Intellectual Property Rights</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Artists retain full ownership of their original artwork and designs. By participating
                  in this program, you grant CHTH | چث a non-exclusive license to reproduce, display,
                  and sell merchandise featuring your designs.
                </p>

                <h3 className="text-base font-bold text-primary mb-2">4. Quality Standards</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All designs must meet our quality standards and community guidelines. Designs should
                  be original work, appropriate for all audiences, and comply with copyright laws.
                </p>

                <div className="glass-pill p-4 text-center mt-6">
                  <p className="text-xs font-semibold text-foreground">
                    Scroll through the agreement to enable acceptance button.
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Acceptance */}
            <div className="pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                  hasScrolled ? "bg-primary border-primary text-white" : "border-muted-foreground"
                )}>
                  {hasScrolled && <Check className="w-3 h-3" />}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  I have read and agree to the contract terms
                </span>
              </div>

              <button
                onClick={handleAcceptContract}
                disabled={!hasScrolled || isAccepting}
                className={cn(
                  'btn-highlight text-sm px-6 py-2.5',
                  (!hasScrolled || isAccepting) && 'opacity-40 cursor-not-allowed grayscale'
                )}
              >
                {isAccepting ? 'Processing...' : 'Accept & Join'}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

export default CollabPage

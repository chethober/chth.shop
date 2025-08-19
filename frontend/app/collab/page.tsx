'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Check, ArrowRight, Users, Palette, DollarSign, Shield } from 'lucide-react'
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
      router.push('/login?redirect=/collab')
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Users className="w-4 h-4 mr-2" />
              Artist Collaboration Program
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Join Our
              <span className="text-gradient block">
                Creative Community
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Partner with CHTH | چث to showcase your art on premium merchandise.
              Earn revenue, build your brand, and reach a global audience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleAcceptContract}
                disabled={isAccepting}
                className={cn(
                  'btn-primary text-lg px-8 py-3 group',
                  isAccepting && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isAccepting ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    Accept & Join Now
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <Link href="#contract" className="btn-outline text-lg px-8 py-3">
                Read Contract
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Partner With Us?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We provide everything you need to turn your creativity into a thriving business
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contract Section */}
      <section id="contract" className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Artist Partnership Agreement
              </h2>
              <p className="text-muted-foreground">
                Please read through our partnership terms below
              </p>
            </div>

            <div className="card p-8">
              <div
                className="prose prose-invert max-w-none space-y-6 text-card-foreground max-h-96 overflow-y-auto pr-4"
                onScroll={(e) => {
                  const element = e.target as HTMLDivElement
                  const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100
                  if (scrollPercentage > 80) {
                    setHasScrolled(true)
                  }
                }}
              >
                <h3 className="text-xl font-semibold text-primary mb-4">1. Partnership Overview</h3>
                <p className="text-sm leading-relaxed">
                  This Artist Partnership Agreement ("Agreement") establishes a collaborative relationship
                  between you ("Artist") and CHTH | چث ("Platform") for the creation, promotion, and
                  sale of custom merchandise featuring your original artwork.
                </p>

                <h3 className="text-xl font-semibold text-primary mb-4">2. Revenue Sharing</h3>
                <p className="text-sm leading-relaxed">
                  Artists receive 70% of net sales revenue from products featuring their designs.
                  Net sales are calculated after deducting payment processing fees, returns, and
                  production costs. Payments are processed monthly via your preferred payment method.
                </p>

                <h3 className="text-xl font-semibold text-primary mb-4">3. Intellectual Property Rights</h3>
                <p className="text-sm leading-relaxed">
                  Artists retain full ownership of their original artwork and designs. By participating
                  in this program, you grant CHTH | چث a non-exclusive license to reproduce, display,
                  and sell merchandise featuring your designs. This license remains in effect only
                  while you are an active partner.
                </p>

                <h3 className="text-xl font-semibold text-primary mb-4">4. Quality Standards</h3>
                <p className="text-sm leading-relaxed">
                  All designs must meet our quality standards and community guidelines. Designs should
                  be original work, appropriate for all audiences, and comply with copyright laws.
                  CHTH | چث reserves the right to reject designs that don't meet these standards.
                </p>

                <h3 className="text-xl font-semibold text-primary mb-4">5. Artist Responsibilities</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Provide high-quality, original artwork in required formats</li>
                  <li>Respond to customer inquiries about your designs within 48 hours</li>
                  <li>Maintain accurate profile information and contact details</li>
                  <li>Promote your CHTH | چث store through your own channels when possible</li>
                </ul>

                <h3 className="text-xl font-semibold text-primary mb-4">6. Platform Responsibilities</h3>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>Handle all production, fulfillment, and shipping of merchandise</li>
                  <li>Process customer payments and handle returns/exchanges</li>
                  <li>Provide marketing support and feature outstanding artists</li>
                  <li>Maintain the technical platform and design tools</li>
                </ul>

                <h3 className="text-xl font-semibold text-primary mb-4">7. Termination</h3>
                <p className="text-sm leading-relaxed">
                  Either party may terminate this agreement with 30 days written notice. Upon
                  termination, all licenses granted under this agreement will cease, and any
                  outstanding payments will be processed according to the normal payment schedule.
                </p>

                <h3 className="text-xl font-semibold text-primary mb-4">8. Dispute Resolution</h3>
                <p className="text-sm leading-relaxed">
                  Any disputes arising from this agreement will be resolved through binding arbitration
                  in accordance with the rules of the American Arbitration Association.
                </p>

                <div className="bg-primary/10 p-4 rounded-lg mt-8">
                  <p className="text-sm font-medium">
                    By clicking "Accept & Join Now," you acknowledge that you have read,
                    understood, and agree to be bound by the terms of this Artist Partnership Agreement.
                  </p>
                </div>
              </div>

              {/* Contract Acceptance */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center",
                      hasScrolled ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                      {hasScrolled && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      I have read and understand the contract terms
                    </span>
                  </div>

                  <button
                    onClick={handleAcceptContract}
                    disabled={!hasScrolled || isAccepting}
                    className={cn(
                      'btn-primary px-6 py-2',
                      (!hasScrolled || isAccepting) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {isAccepting ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      'Accept & Join'
                    )}
                  </button>
                </div>

                {!hasScrolled && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Please scroll through the entire contract to continue
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of artists who are already earning from their creativity
            </p>

            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="btn-primary text-lg px-8 py-3">
                  Create Account
                </Link>
                <Link href="/login" className="btn-outline text-lg px-8 py-3">
                  Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default CollabPage

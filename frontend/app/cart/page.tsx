'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, Sparkles, CheckCircle2, X, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Order } from '@/types'

export default function CartPage() {
  const router = useRouter()
  const { cart, isLoading, error, fetchCart, updateCartItem, removeFromCart, clearCart } = useCartStore()
  const { isAuthenticated, user } = useAuthStore()

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [shippingAddress, setShippingAddress] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/cart')
      return
    }
    fetchCart()
  }, [isAuthenticated, router, fetchCart])

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    try {
      await updateCartItem(itemId, newQuantity)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update quantity')
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeFromCart(itemId)
      toast.success('Item removed from cart')
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove item')
    }
  }

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart()
        toast.success('Cart cleared')
      } catch (err: any) {
        toast.error(err.message || 'Failed to clear cart')
      }
    }
  }

  const handleProceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    setIsCheckoutOpen(true)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingAddress.trim()) {
      toast.error('Please enter a valid shipping address')
      return
    }

    try {
      setIsPlacingOrder(true)
      const order = await api.createOrder({ shippingAddress: shippingAddress.trim() })
      setCompletedOrder(order)
      await fetchCart()
      toast.success('Order placed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order')
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center pt-20 px-4">
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/3 left-1/3 w-[450px] h-[450px] bg-purple-500/15 rounded-full blur-[140px]" />
        </div>
        <div className="glass-card-rounded p-8 sm:p-12 text-center max-w-md w-full space-y-6">
          <div className="w-20 h-20 glass-pill flex items-center justify-center mx-auto text-primary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Sign in to view your cart</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You need to be signed in to access your shopping cart and manage your items.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/auth?redirect=/cart" className="btn-highlight w-full sm:w-auto">
              Sign In
            </Link>
            <Link href="/" className="btn-glass-pill w-full sm:w-auto">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading && !cart) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center pt-20">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading Cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors glass-pill px-3 py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl glass text-primary">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Shopping Cart</h1>
          </div>
        </div>

        {!cart || cart.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-rounded p-12 text-center max-w-xl mx-auto space-y-6"
          >
            <div className="w-20 h-20 glass-pill flex items-center justify-center mx-auto text-primary">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">Your cart is empty</h2>
              <p className="text-xs text-muted-foreground">Discover unique merchandise from talented artists and creators.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/" className="btn-highlight w-full sm:w-auto">
                Browse Products
              </Link>
              <Link href="/design" className="btn-glass-pill w-full sm:w-auto">
                Create Design
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card-rounded p-6 sm:p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-border/30 pb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    Cart Items ({cart.totalItems})
                  </h2>
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden glass shrink-0 relative">
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            No Image
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h3 className="font-bold text-foreground text-sm truncate">
                          {item.product?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.product?.type}
                        </p>
                        <p className="font-extrabold text-primary text-sm mt-1">
                          ${(item.product?.price || 0).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 glass-pill px-3 py-1">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-extrabold text-foreground text-sm">
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-foreground/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card-rounded p-6 space-y-6 sticky top-24"
              >
                <h2 className="text-lg font-bold text-foreground border-b border-border/30 pb-3">Order Summary</h2>
                
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items ({cart.totalItems})</span>
                    <span className="font-semibold text-foreground">${cart.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-semibold text-emerald-500">Free</span>
                  </div>
                  <div className="border-t border-border/30 pt-3 flex justify-between font-extrabold text-base text-foreground">
                    <span>Total</span>
                    <span>${cart.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="btn-highlight w-full gap-2 py-3"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Proceed to Checkout</span>
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card-rounded max-w-lg w-full p-8 shadow-2xl relative"
            >
              {!completedOrder ? (
                <form onSubmit={handlePlaceOrder} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/30 pb-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-bold text-foreground">Complete Checkout</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>Shipping Address</span>
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Street address, apartment, city, state, postal code..."
                        className="w-full p-3 rounded-2xl glass border border-white/20 bg-background/50 text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="glass p-4 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Items ({cart?.totalItems})</span>
                        <span className="font-semibold text-foreground">${(cart?.totalPrice || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Delivery</span>
                        <span className="font-semibold text-emerald-500">Free Express</span>
                      </div>
                      <div className="border-t border-border/30 pt-2 flex justify-between font-extrabold text-sm text-foreground">
                        <span>Total to Pay</span>
                        <span className="text-primary">${(cart?.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(false)}
                      className="btn-glass-pill text-xs py-2 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPlacingOrder}
                      className="btn-highlight text-xs py-2 px-6 gap-2"
                    >
                      {isPlacingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm & Place Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-extrabold text-foreground">Order Confirmed!</h2>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Thank you for your purchase! Your order ID is <span className="font-mono text-foreground font-semibold">{completedOrder.id}</span>.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                      href="/account"
                      className="btn-highlight text-xs py-2.5 px-5"
                      onClick={() => {
                        setIsCheckoutOpen(false)
                        setCompletedOrder(null)
                      }}
                    >
                      View in Account
                    </Link>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(false)
                        setCompletedOrder(null)
                      }}
                      className="btn-glass-pill text-xs py-2.5 px-5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
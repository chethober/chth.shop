'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Store, Palette, Settings, Plus, Edit, Trash2, Check, X, ExternalLink, Globe, Share2, Package, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { cn, generatePlaceholderImage, formatDate } from '@/lib/utils'
import api from '@/lib/api'
import { ProductType, Artist, Order } from '@/types'
import { SocialLinks } from '@/components/SocialLinks'
import { SOCIAL_PLATFORMS } from '@/lib/social'
import { getSocialIcon } from '@/components/SocialIcons'

interface ArtistProfile {
  id: string | number
  bio: string | null
  storeName: string | null
  instagram?: string | null
  twitter?: string | null
  tiktok?: string | null
  youtube?: string | null
  spotify?: string | null
  telegram?: string | null
  discord?: string | null
  website?: string | null
  user: {
    username: string
    email: string
  }
}

interface Product {
  id: string | number
  name: string
  type: string
  price: number
  imageUrl: string | null
}

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateUsername } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'designs' | 'orders'>('profile')
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [agreedToContract, setAgreedToContract] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [usernameFormData, setUsernameFormData] = useState({
    newUsername: ''
  })
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    storeName: '',
    bio: '',
    instagram: '',
    twitter: '',
    tiktok: '',
    youtube: '',
    spotify: '',
    telegram: '',
    discord: '',
    website: '',
  })

  const [productFormData, setProductFormData] = useState<{
    name: string;
    type: ProductType;
    price: number;
  }>({
    name: '',
    type: 'tshirt',
    price: 0
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/account')
      return
    }

    // Load user data
    loadUserData()
  }, [isAuthenticated, router])

  // Check if user is already an artist on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      checkArtistStatus()
    }
  }, [isAuthenticated, user])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout)
      }
    }
  }, [usernameCheckTimeout])

  const checkArtistStatus = async () => {
    try {
      console.log('Checking artist status for user:', user?.username)
      const artist = await api.getCurrentArtistProfile()
      console.log('Found existing artist profile:', artist)
      if (artist) {
        setArtistProfile({
          id: artist.id,
          bio: artist.bio,
          storeName: artist.storeName,
          instagram: artist.instagram,
          twitter: artist.twitter,
          tiktok: artist.tiktok,
          youtube: artist.youtube,
          spotify: artist.spotify,
          telegram: artist.telegram,
          discord: artist.discord,
          website: artist.website,
          user: {
            username: user?.username || '',
            email: user?.email || '',
          },
        })
        setFormData({
          storeName: artist.storeName || '',
          bio: artist.bio || '',
          instagram: artist.instagram || '',
          twitter: artist.twitter || '',
          tiktok: artist.tiktok || '',
          youtube: artist.youtube || '',
          spotify: artist.spotify || '',
          telegram: artist.telegram || '',
          discord: artist.discord || '',
          website: artist.website || '',
        })
      }
    } catch (error: any) {
      // Artist profile not found, which is fine for new users
      console.log('No existing artist profile found:', error.message)
    }
  }

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 5) {
      setUsernameStatus('idle')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus('idle')
      return
    }

    // If username is the same as current username, show as available
    if (username === user?.username) {
      setUsernameStatus('available')
      return
    }

    // Clear previous timeout
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout)
    }

    // Set new timeout for debounced check
    const timeout = setTimeout(async () => {
      try {
        setUsernameStatus('checking')
        
        // Try to get the user with this username
        const response = await api.get(`/artists/${username}`)
        
        // If we get a response, username is taken
        setUsernameStatus('taken')
      } catch (error: any) {
        // If we get a 404, username is available
        if (error.status === 404) {
          setUsernameStatus('available')
        } else {
          setUsernameStatus('idle')
        }
      }
    }, 500) // 500ms delay

    setUsernameCheckTimeout(timeout)
  }

  const loadUserData = async () => {
    try {
      console.log('Loading user data for:', user?.username)
      // Fetch or initialize artist profile
      if (!user?.username) return
      
      try {
        // First try to get the current user's artist profile
        console.log('Attempting to get current artist profile...')
        const artist = await api.getCurrentArtistProfile()
        console.log('Successfully loaded artist profile:', artist)
        
        if (artist) {
          setArtistProfile({
            id: artist.id,
            bio: artist.bio,
            storeName: artist.storeName,
            instagram: artist.instagram,
            twitter: artist.twitter,
            tiktok: artist.tiktok,
            youtube: artist.youtube,
            spotify: artist.spotify,
            telegram: artist.telegram,
            discord: artist.discord,
            website: artist.website,
            user: {
              username: user.username,
              email: user.email,
            },
          })

          setFormData({
            storeName: artist.storeName || '',
            bio: artist.bio || '',
            instagram: artist.instagram || '',
            twitter: artist.twitter || '',
            tiktok: artist.tiktok || '',
            youtube: artist.youtube || '',
            spotify: artist.spotify || '',
            telegram: artist.telegram || '',
            discord: artist.discord || '',
            website: artist.website || '',
          })
        }
      } catch (error: any) {
        // If artist profile not found, set profile to null to allow creation
        console.log('Error loading artist profile:', error)
        if (error.status === 404) {
          console.log('Artist profile not found (404)')
          setArtistProfile(null)
          setFormData({
            storeName: '',
            bio: '',
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            spotify: '',
            telegram: '',
            discord: '',
            website: '',
          })
        } else if (error.status === 401 || error.message?.toLowerCase().includes('token')) {
          console.log('Invalid or expired auth token')
          setArtistProfile(null)
          logout()
          router.push('/auth?redirect=/account')
        } else {
          // For other errors, show the error but still allow profile creation
          console.error('Error fetching artist profile:', error)
          toast.error(error.message || 'Failed to load artist profile')
          setArtistProfile(null)
          setFormData({
            storeName: '',
            bio: '',
            instagram: '',
            twitter: '',
            tiktok: '',
            youtube: '',
            spotify: '',
            telegram: '',
            discord: '',
            website: '',
          })
        }
      }

      // Fetch user products
      try {
        console.log('Fetching user products...')
        const userProducts = await api.getUserProducts()
        console.log('Successfully loaded user products:', userProducts.products)
        setProducts(userProducts.products)
      } catch (error: any) {
        console.error('Error fetching user products:', error)
        // Don't show error for products, just set empty array
        setProducts([])
      }

    } catch (error: any) {
      console.error('Error in loadUserData:', error)
      toast.error('Failed to load user data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const payload = {
        storeName: formData.storeName,
        bio: formData.bio,
        instagram: formData.instagram || null,
        twitter: formData.twitter || null,
        tiktok: formData.tiktok || null,
        youtube: formData.youtube || null,
        spotify: formData.spotify || null,
        telegram: formData.telegram || null,
        discord: formData.discord || null,
        website: formData.website || null,
      }

      if (artistProfile) {
        const updated = await api.updateArtistProfile(payload)
        setArtistProfile(prev => prev ? {
          ...prev,
          storeName: updated.storeName ?? '',
          bio: updated.bio ?? '',
          instagram: updated.instagram,
          twitter: updated.twitter,
          tiktok: updated.tiktok,
          youtube: updated.youtube,
          spotify: updated.spotify,
          telegram: updated.telegram,
          discord: updated.discord,
          website: updated.website,
        } : null)
        toast.success('Profile updated successfully!')
      } else {
        try {
          const created = await api.createArtistProfile(payload as any)
          setArtistProfile({
            id: created.id,
            bio: created.bio,
            storeName: created.storeName,
            instagram: created.instagram,
            twitter: created.twitter,
            tiktok: created.tiktok,
            youtube: created.youtube,
            spotify: created.spotify,
            telegram: created.telegram,
            discord: created.discord,
            website: created.website,
            user: { username: user?.username || '', email: user?.email || '' }
          })
          toast.success('Artist profile created successfully!')
        } catch (error: any) {
          if (error.message === 'Artist profile already exists') {
            try {
              const existingProfile = await api.getCurrentArtistProfile()
              setArtistProfile({
                id: existingProfile.id,
                bio: existingProfile.bio,
                storeName: existingProfile.storeName,
                instagram: existingProfile.instagram,
                twitter: existingProfile.twitter,
                tiktok: existingProfile.tiktok,
                youtube: existingProfile.youtube,
                spotify: existingProfile.spotify,
                telegram: existingProfile.telegram,
                discord: existingProfile.discord,
                website: existingProfile.website,
                user: { username: user?.username || '', email: user?.email || '' }
              })
              setFormData({
                storeName: existingProfile.storeName || '',
                bio: existingProfile.bio || '',
                instagram: existingProfile.instagram || '',
                twitter: existingProfile.twitter || '',
                tiktok: existingProfile.tiktok || '',
                youtube: existingProfile.youtube || '',
                spotify: existingProfile.spotify || '',
                telegram: existingProfile.telegram || '',
                discord: existingProfile.discord || '',
                website: existingProfile.website || '',
              })
              toast.success('Artist profile loaded successfully!')
            } catch (fetchError: any) {
              toast.error('Profile already exists but could not be loaded. Please refresh the page.')
            }
          } else {
            throw error
          }
        }
      }
      setIsEditing(false)
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateUsername = async () => {
    try {
      setSaving(true)
      setUsernameError('')

      // Validate username length
      if (usernameFormData.newUsername.length < 5) {
        setUsernameError('Username must be at least 5 characters long')
        return
      }

      // Validate username format
      if (!/^[a-zA-Z0-9_]+$/.test(usernameFormData.newUsername)) {
        setUsernameError('Username can only contain letters, numbers, and underscores')
        return
      }

      // Use the auth store to update username
      await updateUsername(usernameFormData.newUsername)
      
      // Update local artist profile state if it exists
      if (artistProfile) {
        setArtistProfile(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            username: usernameFormData.newUsername
          }
        } : null)
      }
      
      setIsEditingUsername(false)
      setUsernameFormData({ newUsername: '' })
      
    } catch (error: any) {
      console.error('Error updating username:', error)
      if (error.message === 'Username is already taken') {
        setUsernameError('This username is already taken. Please choose another one.')
      } else {
        setUsernameError(error.message || 'Failed to update username')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormData({ 
      name: product.name, 
      type: product.type as ProductType, 
      price: product.price 
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      setSaving(true)
      const updatedProduct = await api.updateProduct(String(editingProduct.id), productFormData)
      setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      setIsEditModalOpen(false)
      setEditingProduct(null)
      toast.success('Product updated successfully!')
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (productId: string | number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.deleteProduct(String(productId))
        setProducts(products.filter(p => p.id !== productId))
        toast.success('Product deleted successfully!')
      } catch (error: any) {
        console.error('Error deleting product:', error)
        toast.error(error.message || 'Failed to delete product')
      }
    }
  }

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const fetchedOrders = await api.getOrders()
      setOrders(fetchedOrders || [])
    } catch (error: any) {
      console.error('Error loading orders:', error)
      toast.error(error.message || 'Failed to load orders')
    } finally {
      setIsLoadingOrders(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
    }
  }, [activeTab])

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        const updated = await api.cancelOrder(orderId)
        setOrders(orders.map(o => o.id === orderId ? updated : o))
        toast.success('Order cancelled successfully')
      } catch (error: any) {
        console.error('Error cancelling order:', error)
        toast.error(error.message || 'Failed to cancel order')
      }
    }
  }

  const handleDeleteArtistProfile = async () => {
    if (window.confirm('Are you sure you want to delete your artist store? This will delete your artist profile and all products.')) {
      try {
        await api.deleteArtistProfile()
        setArtistProfile(null)
        setProducts([])
        toast.success('Artist store deleted successfully')
      } catch (error: any) {
        console.error('Error deleting artist store:', error)
        toast.error(error.message || 'Failed to delete artist store')
      }
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      try {
        await api.deleteAccount()
        toast.success('Account deleted successfully')
        router.push('/')
      } catch (error: any) {
        console.error('Error deleting account:', error)
        toast.error(error.message || 'Failed to delete account')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading account...</p>
        </div>
      </div>
    )
  }

  const hasAnySocials = Boolean(
    artistProfile?.instagram ||
    artistProfile?.twitter ||
    artistProfile?.tiktok ||
    artistProfile?.youtube ||
    artistProfile?.spotify ||
    artistProfile?.telegram ||
    artistProfile?.discord ||
    artistProfile?.website
  )

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Artist Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your profile, social presence, store, and creative designs
            </p>
          </div>
          {artistProfile && (
            <Link
              href={`/${user?.username}`}
              target="_blank"
              className="btn-glass-pill self-start sm:self-auto text-xs py-2 px-4 gap-2"
            >
              <span>View Public Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="glass-card-rounded p-6 space-y-6">
              {/* User Info */}
              <div className="text-center">
                <div className="w-20 h-20 glass-pill flex items-center justify-center mx-auto mb-3 text-primary shadow-md">
                  <User className="w-10 h-10" />
                </div>
                <h3 className="font-extrabold text-foreground">{user?.username}</h3>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <button
                  onClick={() => {
                    setIsEditingUsername(true)
                    setUsernameFormData({ newUsername: user?.username || '' })
                    setUsernameError('')
                  }}
                  className="btn-glass-pill text-[11px] mt-3 px-3 py-1 gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Change Username
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-1.5">
                {[
                  { id: 'profile', label: 'Profile & Socials', icon: User },
                  { id: 'store', label: 'My Store', icon: Store },
                  { id: 'orders', label: 'My Orders', icon: Package },
                  { id: 'designs', label: 'Designs', icon: Palette }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Actions */}
              <div className="pt-4 border-t border-border/30 space-y-2">
                <button
                  onClick={() => router.push('/design')}
                  className="w-full btn-highlight text-xs py-2.5 gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Design</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full btn-glass-pill text-xs py-2.5"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="glass-card-rounded p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">Artist Profile</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Information visible to fans and visitors on your public page
                        </p>
                      </div>
                      {artistProfile ? (
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="btn-outline flex items-center text-xs py-2 px-3 gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-primary flex items-center text-xs py-2 px-3 gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Profile
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-8">
                        {/* Store & Bio Section */}
                        <div className="space-y-5">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                            General Details
                          </h3>
                          
                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                              Store Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.storeName}
                              onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                              className="w-full p-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                              placeholder="e.g. Cosmic Creations"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-foreground mb-1.5">
                              Biography / About the Artist
                            </label>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                              rows={3}
                              className="w-full p-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                              placeholder="Tell fans about yourself, inspiration, and unique art style..."
                            />
                          </div>
                        </div>

                        {/* Social Media Management Section */}
                        <div className="space-y-4 pt-4 border-t border-border/30">
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                              Social Media & Presence
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Connect your channels to let visitors follow you and find more of your work.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {SOCIAL_PLATFORMS.map((platform) => {
                              const value = (formData as any)[platform.id] || ''
                              return (
                                <div key={platform.id} className="space-y-1.5">
                                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                    <span
                                      className="w-5 h-5 rounded-md flex items-center justify-center"
                                      style={{ backgroundColor: platform.brandHoverBg, color: platform.brandColor }}
                                    >
                                      {getSocialIcon(platform.id, { size: 13 })}
                                    </span>
                                    <span>{platform.label}</span>
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) => setFormData(prev => ({ ...prev, [platform.id]: e.target.value }))}
                                      className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-border bg-background/50 text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                                      placeholder={platform.placeholder}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {!artistProfile && (
                          <div className="flex items-center space-x-2 pt-2">
                            <input
                              type="checkbox"
                              id="contract-agreement"
                              checked={agreedToContract}
                              onChange={(e) => setAgreedToContract(e.target.checked)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="contract-agreement" className="text-xs text-muted-foreground">
                              I agree to the <a href="/collab" target="_blank" className="text-primary hover:underline font-semibold">artist collaboration agreement</a>.
                            </label>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                          <button
                            onClick={handleSaveProfile}
                            className={cn('btn-primary text-xs py-2.5 px-6', (saving || (!artistProfile && !agreedToContract)) && 'opacity-50 cursor-not-allowed')}
                            disabled={saving || (!artistProfile && !agreedToContract)}
                          >
                            {saving ? 'Saving...' : 'Save Profile'}
                          </button>
                          <button
                            onClick={() => setIsEditing(false)}
                            className="btn-outline text-xs py-2.5 px-5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : artistProfile ? (
                      <div className="space-y-8">
                        {/* Profile Info Grid */}
                        <div className="grid sm:grid-cols-2 gap-6">
                          <div className="glass p-4 rounded-2xl space-y-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Store Name</h3>
                            <p className="text-base font-bold text-foreground">{artistProfile.storeName || '-'}</p>
                          </div>

                          <div className="glass p-4 rounded-2xl space-y-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Username</h3>
                            <div className="flex items-center justify-between">
                              <p className="text-base font-bold text-primary">@{artistProfile.user.username}</p>
                              <button
                                onClick={() => {
                                  setIsEditingUsername(true)
                                  setUsernameFormData({ newUsername: artistProfile.user.username })
                                  setUsernameError('')
                                }}
                                className="btn-glass-pill text-[11px] px-2.5 py-1"
                              >
                                Edit
                              </button>
                            </div>
                          </div>

                          <div className="sm:col-span-2 glass p-4 rounded-2xl space-y-1">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">About / Bio</h3>
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                              {artistProfile.bio || <span className="text-muted-foreground italic">No bio added yet. Click edit to tell your story!</span>}
                            </p>
                          </div>
                        </div>

                        {/* Connected Social Profiles */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">
                              Connected Social Profiles
                            </h3>
                            {hasAnySocials && (
                              <button
                                onClick={() => setIsEditing(true)}
                                className="text-xs text-primary hover:underline font-semibold"
                              >
                                Manage Links
                              </button>
                            )}
                          </div>

                          {hasAnySocials ? (
                            <SocialLinks
                              socials={{
                                instagram: artistProfile.instagram,
                                twitter: artistProfile.twitter,
                                tiktok: artistProfile.tiktok,
                                youtube: artistProfile.youtube,
                                spotify: artistProfile.spotify,
                                telegram: artistProfile.telegram,
                                discord: artistProfile.discord,
                                website: artistProfile.website,
                              }}
                              variant="cards"
                            />
                          ) : (
                            <div className="glass p-6 rounded-2xl text-center space-y-2 border border-dashed border-border/60">
                              <Globe className="w-8 h-8 text-muted-foreground mx-auto" />
                              <p className="text-xs text-muted-foreground">
                                You haven't added any social links yet. Add your Instagram, Twitter/X, TikTok, Spotify or website to connect with your audience.
                              </p>
                              <button
                                onClick={() => setIsEditing(true)}
                                className="btn-glass-pill text-xs py-1.5 px-4 mt-2 inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Social Media</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-6 border-t border-border/30 space-y-4">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h3>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={handleDeleteArtistProfile}
                              className="btn-outline text-destructive hover:bg-destructive/10 text-xs py-2 px-4 inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Artist Store</span>
                            </button>

                            <button
                              onClick={handleDeleteAccount}
                              className="btn-outline text-destructive hover:bg-destructive/10 text-xs py-2 px-4 inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete User Account</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Artist Profile Yet</h3>
                        <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-6">
                          Create your artist profile to start selling your designs, managing your store, and showcasing your social presence.
                        </p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="btn-primary text-xs py-2.5 px-6 inline-flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Artist Profile
                        </button>
                      </div>
                    )}

                    {/* Username Edit Modal */}
                    {isEditingUsername && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background rounded-xl p-8 w-full max-w-md">
                          <h2 className="text-2xl font-bold text-foreground mb-6">Change Username</h2>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-2">
                                New Username
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={usernameFormData.newUsername}
                                  onChange={(e) => {
                                    setUsernameFormData({ newUsername: e.target.value })
                                    setUsernameError('')
                                    checkUsernameAvailability(e.target.value)
                                  }}
                                  className={cn(
                                    "w-full p-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary",
                                    usernameStatus === 'available' && "border-green-500 focus:ring-green-500",
                                    usernameStatus === 'taken' && "border-red-500 focus:ring-red-500",
                                    usernameStatus === 'idle' && "border-border focus:ring-primary"
                                  )}
                                  placeholder="Enter new username (min 5 characters)"
                                />
                                {usernameStatus === 'checking' && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                  </div>
                                )}
                                {usernameStatus === 'available' && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Check className="w-4 h-4 text-green-500" />
                                  </div>
                                )}
                                {usernameStatus === 'taken' && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <X className="w-4 h-4 text-red-500" />
                                  </div>
                                )}
                              </div>
                              {usernameError && (
                                <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Username must be at least 5 characters and can only contain letters, numbers, and underscores.
                              </p>
                              {usernameStatus === 'checking' && (
                                <p className="text-sm text-muted-foreground">Checking availability...</p>
                              )}
                              {usernameStatus === 'available' && (
                                <p className="text-sm text-green-500">Username is available!</p>
                              )}
                              {usernameStatus === 'taken' && (
                                <p className="text-sm text-red-500">Username is already taken.</p>
                              )}
                              {usernameFormData.newUsername === user?.username && (
                                <p className="text-sm text-muted-foreground">This is your current username.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end space-x-4 mt-8">
                            <button 
                              onClick={() => {
                                setIsEditingUsername(false)
                                setUsernameFormData({ newUsername: '' })
                                setUsernameError('')
                              }} 
                              className="btn-outline"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleUpdateUsername} 
                              className={cn(
                                'btn-primary', 
                                (saving || 
                                 usernameFormData.newUsername.length < 5 || 
                                 usernameStatus === 'taken' ||
                                 usernameStatus === 'checking' ||
                                 usernameFormData.newUsername === user?.username) && 'opacity-50 cursor-not-allowed'
                              )} 
                              disabled={
                                saving || 
                                usernameFormData.newUsername.length < 5 || 
                                usernameStatus === 'taken' ||
                                usernameStatus === 'checking' ||
                                usernameFormData.newUsername === user?.username
                              }
                            >
                              {saving ? 'Updating...' : 'Update Username'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'store' && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">My Store</h2>
                    <button
                      onClick={() => router.push('/design')}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <div key={product.id} className="bg-card rounded-lg overflow-hidden">
                        <div className="aspect-square bg-muted relative">
                          <img
                            src={product.imageUrl || generatePlaceholderImage(200, 200, product.name)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-card-foreground mb-1">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 capitalize">{product.type}</p>
                          <p className="text-lg font-bold text-primary">${product.price}</p>
                          <div className="flex space-x-2 mt-3">
                            <button onClick={() => handleEditProduct(product)} className="btn-outline flex-1 text-sm">Edit</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="btn-outline text-sm p-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="glass rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border/30 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">My Orders</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Track, view, and manage your merchandise orders
                      </p>
                    </div>
                    <button
                      onClick={loadOrders}
                      className="btn-glass-pill text-xs py-1.5 px-3"
                    >
                      Refresh
                    </button>
                  </div>

                  {isLoadingOrders ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-muted-foreground font-semibold">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <Package className="w-16 h-16 text-muted-foreground mx-auto" />
                      <div>
                        <h3 className="text-lg font-bold text-foreground">No orders yet</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          When you purchase items from artists, they will appear here.
                        </p>
                      </div>
                      <Link href="/" className="btn-highlight inline-flex text-xs py-2.5 px-5">
                        Browse Marketplace
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="glass p-5 rounded-2xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3 text-xs">
                            <div className="space-y-0.5">
                              <span className="font-mono font-bold text-foreground">Order #{order.id.slice(0, 8)}...</span>
                              <p className="text-muted-foreground text-[11px]">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase",
                                order.status === 'DELIVERED' && "bg-emerald-500/20 text-emerald-500",
                                order.status === 'CONFIRMED' && "bg-blue-500/20 text-blue-500",
                                order.status === 'SHIPPED' && "bg-purple-500/20 text-purple-500",
                                order.status === 'PENDING' && "bg-amber-500/20 text-amber-500",
                                order.status === 'CANCELLED' && "bg-destructive/20 text-destructive"
                              )}>
                                {order.status}
                              </span>
                              <span className="font-extrabold text-foreground text-sm">
                                ${order.total.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {order.items?.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs py-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden glass shrink-0">
                                    <img
                                      src={item.product?.imageUrl || generatePlaceholderImage(60, 60, item.product?.name || 'Item')}
                                      alt={item.product?.name || 'Product'}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{item.product?.name || 'Item'}</p>
                                    <p className="text-[11px] text-muted-foreground">Qty: {item.quantity} • ${item.price.toFixed(2)} each</p>
                                  </div>
                                </div>
                                <span className="font-semibold text-foreground">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.shippingAddress && (
                            <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/10">
                              <span className="font-semibold text-foreground">Shipping to: </span>
                              {order.shippingAddress}
                            </div>
                          )}

                          {order.status === 'PENDING' && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="btn-outline text-destructive hover:bg-destructive/10 text-xs py-1.5 px-3"
                              >
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'designs' && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">My Designs</h2>
                    <button
                      onClick={() => router.push('/design')}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Design
                    </button>
                  </div>

                  <div className="text-center py-12">
                    <Palette className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No designs yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start creating your first design in our 3D studio
                    </p>
                    <button
                      onClick={() => router.push('/design')}
                      className="btn-primary"
                    >
                      Create Your First Design
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-foreground mb-6">Edit Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                <input
                  type="text"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <input
                  type="text"
                  value={productFormData.type}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, type: e.target.value as ProductType }))}
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                <input
                  type="number"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button onClick={() => setIsEditModalOpen(false)} className="btn-outline">Cancel</button>
              <button onClick={handleUpdateProduct} className={cn('btn-primary', saving && 'opacity-50 cursor-not-allowed')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

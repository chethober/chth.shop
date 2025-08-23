'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Store, Palette, Settings, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import { cn, generatePlaceholderImage } from '@/lib/utils'
import api from '@/lib/api'
import { ProductType } from '@/types'

interface ArtistProfile {
  id: number
  bio: string | null
  storeName: string | null
  user: {
    username: string
    email: string
  }
}

interface Product {
  id: number
  name: string
  type: string
  price: number
  imageUrl: string | null
}

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, updateUsername } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'designs'>('profile')
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
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
    bio: ''
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
      router.push('/login?redirect=/account')
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
          user: {
            username: user?.username || '',
            email: user?.email || '',
          },
        })
        setFormData({
          storeName: artist.storeName || '',
          bio: artist.bio || ''
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
            user: {
              username: user.username,
              email: user.email,
            },
          })

          setFormData({
            storeName: artist.storeName || '',
            bio: artist.bio || ''
          })
        }
      } catch (error: any) {
        // If artist profile not found, set profile to null to allow creation
        console.log('Error loading artist profile:', error)
        if (error.status === 404) {
          console.log('Artist profile not found (404)')
          setArtistProfile(null)
          setFormData({ storeName: '', bio: '' })
        } else {
          // For other errors, show the error but still allow profile creation
          console.error('Error fetching artist profile:', error)
          toast.error(error.message || 'Failed to load artist profile')
          setArtistProfile(null)
          setFormData({ storeName: '', bio: '' })
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
      const payload = { storeName: formData.storeName, bio: formData.bio }

      if (artistProfile) {
        const updated = await api.updateArtistProfile(payload)
        setArtistProfile(prev => prev ? {
          ...prev,
          storeName: updated.storeName ?? '',
          bio: updated.bio ?? ''
        } : null)
        toast.success('Profile updated successfully!')
      } else {
        try {
          const created = await api.createArtistProfile(payload as any)
          setArtistProfile({
            id: created.id,
            bio: created.bio,
            storeName: created.storeName,
            user: { username: user?.username || '', email: user?.email || '' }
          })
          toast.success('Artist profile created successfully!')
        } catch (error: any) {
          if (error.message === 'Artist profile already exists') {
            // If profile already exists, try to fetch it and show it
            try {
              const existingProfile = await api.getCurrentArtistProfile()
              setArtistProfile({
                id: existingProfile.id,
                bio: existingProfile.bio,
                storeName: existingProfile.storeName,
                user: { username: user?.username || '', email: user?.email || '' }
              })
              setFormData({
                storeName: existingProfile.storeName || '',
                bio: existingProfile.bio || ''
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

  const handleDeleteProduct = async (productId: number) => {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Artist Account</h1>
          <p className="text-muted-foreground">
            Manage your profile, store, and designs
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-6 space-y-6">
              {/* User Info */}
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{user?.username}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <button
                  onClick={() => {
                    setIsEditingUsername(true)
                    setUsernameFormData({ newUsername: user?.username || '' })
                    setUsernameError('')
                  }}
                  className="btn-outline text-xs mt-2 px-2 py-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Change Username
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'store', label: 'My Store', icon: Store },
                  { id: 'designs', label: 'Designs', icon: Palette }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Actions */}
              <div className="pt-4 border-t border-border space-y-2">
                <button
                  onClick={() => router.push('/design')}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Design
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-foreground">Artist Profile</h2>
                    {artistProfile ? (
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn-outline flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Profile
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={formData.storeName}
                          onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                          className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter your store name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Bio
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                          rows={4}
                          className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Tell us about yourself and your art..."
                        />
                      </div>

                      {!artistProfile && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="contract-agreement"
                            checked={agreedToContract}
                            onChange={(e) => setAgreedToContract(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor="contract-agreement" className="text-sm text-muted-foreground">
                            I agree to the <a href="/collab" target="_blank" className="text-primary hover:underline">artist collaboration agreement</a>.
                          </label>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveProfile}
                          className={cn('btn-primary', (saving || (!artistProfile && !agreedToContract)) && 'opacity-50 cursor-not-allowed')}
                          disabled={saving || (!artistProfile && !agreedToContract)}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : artistProfile ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Store Name</h3>
                        <p className="text-foreground">{artistProfile.storeName || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                        <p className="text-foreground">{artistProfile.bio || '-'}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Username</h3>
                        <div className="flex items-center justify-between">
                          <p className="text-foreground">@{artistProfile.user.username}</p>
                          <button
                            onClick={() => {
                              setIsEditingUsername(true)
                              setUsernameFormData({ newUsername: artistProfile.user.username })
                              setUsernameError('')
                            }}
                            className="btn-outline text-sm px-3 py-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Change
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-foreground">{artistProfile.user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Artist Profile Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your artist profile to start selling your designs and managing your store.
                      </p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary"
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

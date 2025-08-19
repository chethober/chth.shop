'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Store, Palette, Settings, Plus, Edit, Trash2 } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { cn } from '@/lib/utils'

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
  const { user, isAuthenticated, logout } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'designs'>('profile')
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    storeName: '',
    bio: ''
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account')
      return
    }

    // Load user data
    loadUserData()
  }, [isAuthenticated, router])

  const loadUserData = async () => {
    try {
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data - replace with actual API calls
      setArtistProfile({
        id: 1,
        bio: 'Creating cosmic-inspired designs that transport you to other dimensions.',
        storeName: 'Cosmic Creations',
        user: {
          username: user?.username || 'artist',
          email: user?.email || 'artist@example.com'
        }
      })

      setProducts([
        {
          id: 1,
          name: 'Galaxy Dreams Tee',
          type: 'tshirt',
          price: 29.99,
          imageUrl: '/tshirt.jpg'
        },
        {
          id: 2,
          name: 'Urban Vibes Hoodie',
          type: 'hoodie',
          price: 59.99,
          imageUrl: '/hoodie.jpg'
        }
      ])

      setFormData({
        storeName: 'Cosmic Creations',
        bio: 'Creating cosmic-inspired designs that transport you to other dimensions.'
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setArtistProfile(prev => prev ? {
        ...prev,
        storeName: formData.storeName,
        bio: formData.bio
      } : null)
      
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
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
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="btn-outline flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
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
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={handleSaveProfile}
                          className="btn-primary"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Store Name</h3>
                        <p className="text-foreground">{artistProfile?.storeName}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                        <p className="text-foreground">{artistProfile?.bio}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Username</h3>
                        <p className="text-foreground">@{artistProfile?.user.username}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Email</h3>
                        <p className="text-foreground">{artistProfile?.user.email}</p>
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
                            src={product.imageUrl || ''}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-card-foreground mb-1">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2 capitalize">{product.type}</p>
                          <p className="text-lg font-bold text-primary">${product.price}</p>
                          <div className="flex space-x-2 mt-3">
                            <button className="btn-outline flex-1 text-sm">Edit</button>
                            <button className="btn-outline text-sm p-2">
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
    </div>
  )
}

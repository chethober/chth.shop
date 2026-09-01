'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  User,
  MapPin,
  Calendar,
  Package,
  Star,
  Heart,
  Share2,
  ExternalLink,
  Filter,
  Grid3X3,
  List,
  ChevronDown,
  Sparkles,
  ShoppingBag
} from 'lucide-react'
import { api } from '@/lib/api'
import { Artist, Product, ProductType } from '@/types'
import { cn, formatPrice, formatDate, getProductTypeLabel, generatePlaceholderImage } from '@/lib/utils'
import { SocialLinks } from '@/components/SocialLinks'
import toast from 'react-hot-toast'
import useCartStore from '@/store/cartStore'
import useAuthStore from '@/store/authStore'

const ArtistProfilePage = () => {
  const params = useParams()
  const username = params.username as string
  const { addToCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const [artist, setArtist] = useState<Artist | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'name'>('newest')
  const [isFollowing, setIsFollowing] = useState(false)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart')
      return
    }

    try {
      setAddingProductId(String(product.id))
      await addToCart(String(product.id), 1)
      toast.success(`Added ${product.name} to cart!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item to cart')
    } finally {
      setAddingProductId(null)
    }
  }

  useEffect(() => {
    const loadArtistData = async () => {
      if (!username) return

      try {
        setIsLoading(true)
        setError(null)

        const artistData = await api.getArtist(username)
        setArtist(artistData)
        setProducts(artistData.products || [])
      } catch (error: any) {
        console.error('Error loading artist:', error)
        setError(error.message || 'Artist not found')
      } finally {
        setIsLoading(false)
      }
    }

    loadArtistData()
  }, [username])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artist?.storeName || username} - CHTH | چث`,
          text: `Check out ${artist?.user?.username || username}'s store on CHTH | چث`,
          url: window.location.href,
        })
      } catch (error) {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing)
    if (!isFollowing) {
      toast.success(`Following @${artist?.user?.username || username}!`)
    } else {
      toast('Unfollowed', { icon: '👋' })
    }
  }

  const filteredAndSortedProducts = products
    .filter(product => filterType === 'all' || product.type === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    })

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading Artist Store...</p>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="relative min-h-screen bg-background flex items-center justify-center pt-24 px-4">
        <div className="glass-card-rounded p-12 text-center max-w-md w-full space-y-4">
          <User className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Artist Not Found</h1>
          <p className="text-xs text-muted-foreground">
            The artist profile you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/" className="btn-highlight w-full mt-4 inline-block text-center py-2.5">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    totalProducts: products.length,
    avgRating: 4.9,
    totalReviews: 127 + (products.length * 3),
    memberSince: artist.createdAt || new Date().toISOString()
  }

  const hasSocials = Boolean(
    artist.instagram ||
    artist.twitter ||
    artist.tiktok ||
    artist.youtube ||
    artist.spotify ||
    artist.telegram ||
    artist.discord ||
    artist.website
  )

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] bg-foreground/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Artist Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card-rounded p-8 sm:p-12 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:flex-col lg:items-center lg:w-64 shrink-0">
              <div className="w-28 h-28 glass-pill flex items-center justify-center text-primary shadow-lg ring-2 ring-primary/20">
                <User className="w-14 h-14" />
              </div>

              <div className="text-center sm:text-left lg:text-center space-y-2 w-full">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {artist.storeName || artist.user?.username}
                </h1>
                <p className="text-sm font-semibold text-primary">
                  @{artist.user?.username}
                </p>

                {/* Stats Badges */}
                <div className="flex justify-center gap-3 pt-2">
                  <div className="glass-pill px-3 py-1.5 text-center flex-1 max-w-[90px]">
                    <div className="text-sm font-extrabold text-foreground">{stats.totalProducts}</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Products</div>
                  </div>
                  <div className="glass-pill px-3 py-1.5 text-center flex-1 max-w-[90px]">
                    <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-foreground">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>{stats.avgRating}</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{stats.totalReviews} reviews</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-center gap-2 pt-3">
                  <button
                    onClick={handleShare}
                    className="btn-glass-pill text-xs py-2 px-3.5 gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleToggleFollow}
                    className={cn(
                      "text-xs py-2 px-4 gap-1.5 transition-all",
                      isFollowing ? "btn-glass-pill text-primary border-primary/50" : "btn-highlight"
                    )}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isFollowing && "fill-primary")} />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">About the Artist</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {artist.bio || 'This artist creates unique custom merchandise and apparel designs.'}
                </p>
              </div>

              {/* Social Media Links Section */}
              {hasSocials && (
                <div className="space-y-2 pt-4 border-t border-border/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Connect & Follow
                  </h3>
                  <SocialLinks
                    socials={{
                      instagram: artist.instagram,
                      twitter: artist.twitter,
                      tiktok: artist.tiktok,
                      youtube: artist.youtube,
                      spotify: artist.spotify,
                      telegram: artist.telegram,
                      discord: artist.discord,
                      website: artist.website,
                    }}
                    variant="pills"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground glass-pill px-3 py-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Joined {formatDate(stats.memberSince)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground glass-pill px-3 py-1">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  <span>{stats.totalProducts} products designed</span>
                </div>
              </div>

              {/* Featured Work Preview */}
              {products.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Featured Highlights
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        className="relative aspect-square rounded-2xl overflow-hidden glass group cursor-pointer border border-border/30 hover:border-primary/40 transition-colors"
                      >
                        <Image
                          src={product.imageUrl || generatePlaceholderImage(200, 200, product.name)}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors" />
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <div className="text-white text-xs font-bold truncate">
                            {product.name}
                          </div>
                          <div className="text-white/80 text-[11px] font-semibold">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                All Products ({filteredAndSortedProducts.length})
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
                className="glass-pill px-4 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="tshirt">T-Shirts</option>
                <option value="hoodie">Hoodies</option>
                <option value="pants">Pants</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="glass-pill px-4 py-2 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {filteredAndSortedProducts.length === 0 ? (
            <div className="glass-card-rounded p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No products found</h3>
              <p className="text-xs text-muted-foreground mt-1">This artist hasn't published any products matching your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="glass-card-rounded p-5 group cursor-pointer hover:scale-[1.02] transition-all"
                >
                  <div className="relative aspect-square mb-4 rounded-2xl overflow-hidden glass">
                    <Image
                      src={product.imageUrl || generatePlaceholderImage(300, 300, product.name)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {getProductTypeLabel(product.type)}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-base font-extrabold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingProductId === String(product.id)}
                      className="w-full mt-2 btn-highlight text-xs py-2 gap-1.5 flex items-center justify-center"
                    >
                      {addingProductId === String(product.id) ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArtistProfilePage

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
  ChevronDown
} from 'lucide-react'
import { api } from '@/lib/api'
import { Artist, Product, ProductType } from '@/types'
import { cn, formatPrice, formatDate, getProductTypeLabel, generatePlaceholderImage } from '@/lib/utils'
import toast from 'react-hot-toast'

const ArtistProfilePage = () => {
  const params = useParams()
  const username = params.username as string

  const [artist, setArtist] = useState<Artist | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<ProductType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'name'>('newest')

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
                  title: `${artist?.storeName} - CHTH | چث`,
        text: `Check out ${artist?.user?.username}'s store on CHTH | چث`,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Loading skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-4">
                  <div className="h-48 bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Artist Not Found</h1>
          <p className="text-muted-foreground max-w-md">
            The artist profile you're looking for doesn't exist or may have been removed.
          </p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const stats = {
    totalProducts: products.length,
    avgRating: 4.8, // Sample data
    totalReviews: 127, // Sample data
    memberSince: artist.createdAt || new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Artist Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:flex-col lg:items-center lg:w-64">
              <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-primary" />
              </div>

              <div className="text-center sm:text-left lg:text-center space-y-2">
                <h1 className="text-3xl font-bold text-card-foreground">
                  {artist.storeName}
                </h1>
                <p className="text-lg text-muted-foreground">
                  @{artist.user?.username}
                </p>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start lg:justify-center space-x-6 pt-2">
                  <div className="text-center">
                    <div className="text-xl font-bold text-card-foreground">{stats.totalProducts}</div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-xl font-bold text-card-foreground">{stats.avgRating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{stats.totalReviews} reviews</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center sm:justify-start lg:justify-center space-x-3 pt-4">
                  <button
                    onClick={handleShare}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button className="btn-ghost flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Follow</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bio and Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-card-foreground mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {artist.bio || 'This artist hasn\'t added a bio yet.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(stats.memberSince)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>{stats.totalProducts} products</span>
                </div>
              </div>

              {/* Featured/Recent Work */}
              {products.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-lg font-semibold text-card-foreground mb-3">Featured Work</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.slice(0, 3).map((product) => (
                      <div
                        key={product.id}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                      >
                        <Image
                          src={product.imageUrl || generatePlaceholderImage(200, 200, product.name)}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="text-white text-sm font-medium truncate drop-shadow-sm">
                            {product.name}
                          </div>
                          <div className="text-white/80 text-xs">
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

        {/* Products Section */}
        <div className="space-y-6">
          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Products ({filteredAndSortedProducts.length})
              </h2>
              <p className="text-muted-foreground">
                Discover {artist.user?.username}'s creative merchandise
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filter by Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ProductType | 'all')}
                className="input text-sm py-2 pr-8"
              >
                <option value="all">All Types</option>
                <option value="tshirt">T-Shirts</option>
                <option value="hoodie">Hoodies</option>
                <option value="pants">Pants</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input text-sm py-2 pr-8"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>

              {/* View Mode */}
              <div className="flex border border-border rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-l-md transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-r-md transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No products found
              </h3>
              <p className="text-muted-foreground">
                {filterType === 'all'
                  ? "This artist hasn't created any products yet."
                  : `No ${getProductTypeLabel(filterType as ProductType).toLowerCase()} products found.`
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="product-card card p-4 group cursor-pointer"
                >
                  <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={product.imageUrl || generatePlaceholderImage(300, 300, product.name)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getProductTypeLabel(product.type)}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>4.8</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center space-x-6">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={product.imageUrl || generatePlaceholderImage(96, 96, product.name)}
                        alt={product.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-card-foreground mb-1">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-2">
                        {getProductTypeLabel(product.type)}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className="text-xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>4.8 (12 reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="btn-outline">
                        View Details
                      </button>
                      <button className="btn-primary">
                        Add to Cart
                      </button>
                    </div>
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

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-store'

interface BookFadeProfile {
  id: string
  name: string
  slug: string
  businessName: string | null
  businessAddress: string | null
  businessCity: string | null
  businessState: string | null
  profileImage: string | null
  themeColor: string | null
  bio: string | null
}

interface Product {
  id: string
  name: string
  price: string
  images: string[]
  description: string
  variants?: Array<{
    id: string
    name: string
    sku: string
    price: string
    additionalPrice: string | null
  }>
}

export default function BookFadeCardHolderPage() {
  const router = useRouter()
  const { addItem } = useCart()

  // Product state
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // BookFade connection
  const [bookfadeSlug, setBookfadeSlug] = useState('')
  const [bookfadeProfile, setBookfadeProfile] = useState<BookFadeProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  // Customization
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [customName, setCustomName] = useState('')
  const [customShopName, setCustomShopName] = useState('')
  const [useBookFadeLogo, setUseBookFadeLogo] = useState(true)
  const [customLogoUrl, setCustomLogoUrl] = useState('')
  const [notes, setNotes] = useState('')

  // Checkout
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [])

  // Auto-populate form when BookFade profile is loaded
  useEffect(() => {
    if (bookfadeProfile) {
      setCustomName(bookfadeProfile.name || '')
      setCustomShopName(bookfadeProfile.businessName || '')
    }
  }, [bookfadeProfile])

  async function fetchProduct() {
    try {
      const res = await fetch('/api/products/bookfade-card-holder')
      if (res.ok) {
        const data = await res.json()
        setProduct(data.product)
        if (data.product?.variants?.length > 0) {
          setSelectedVariant(data.product.variants[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    }
    setLoading(false)
  }

  async function connectBookFade() {
    if (!bookfadeSlug.trim()) {
      setConnectionError('Enter your BookFade username')
      return
    }

    setFetchingProfile(true)
    setConnectionError('')

    try {
      const res = await fetch(`/api/admin/bookfade/barbers?slug=${bookfadeSlug.trim()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.barber) {
          setBookfadeProfile(data.barber)
        } else {
          setConnectionError('No BookFade account found with that username')
        }
      } else {
        setConnectionError('Failed to connect to BookFade')
      }
    } catch (error) {
      setConnectionError('Failed to connect to BookFade')
    }
    setFetchingProfile(false)
  }

  function disconnectBookFade() {
    setBookfadeProfile(null)
    setBookfadeSlug('')
    setCustomName('')
    setCustomShopName('')
  }

  function getPrice(): number {
    if (!product) return 0
    const variant = product.variants?.find(v => v.id === selectedVariant)
    const basePrice = Number(variant?.price || product.price)

    if (quantity === 1) {
      return basePrice
    }

    // First unit is full price, additional units use additionalPrice if available
    const additionalPrice = variant?.additionalPrice ? Number(variant.additionalPrice) : basePrice
    return basePrice + (additionalPrice * (quantity - 1))
  }

  async function handleAddToCart() {
    if (!product || !customName) return

    setAddingToCart(true)

    const variant = product.variants?.find(v => v.id === selectedVariant)

    addItem({
      productId: product.id,
      variantId: selectedVariant || undefined,
      name: `${product.name}${variant ? ` - ${variant.name}` : ''}`,
      price: getPrice(),
      image: product.images?.[0] || null,
      quantity: 1, // We handle quantity in customization
      productType: 'PHYSICAL',
      customization: {
        quantity,
        name: customName,
        shopName: customShopName,
        bookfadeSlug: bookfadeProfile?.slug || null,
        bookfadeId: bookfadeProfile?.id || null,
        useBookFadeLogo,
        customLogoUrl: !useBookFadeLogo ? customLogoUrl : null,
        notes,
        profileImage: bookfadeProfile?.profileImage || null,
        themeColor: bookfadeProfile?.themeColor || null,
      },
    })

    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/shop" className="text-accent hover:underline">
          Back to Shop
        </Link>
      </div>
    )
  }

  const totalPrice = getPrice()

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-text-secondary">
          <Link href="/shop" className="hover:text-text-primary">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Product Info & Customization */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-text-secondary mb-6">{product.description}</p>

            {/* BookFade Connection */}
            <div className="bg-surface rounded-xl p-6 mb-6 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Connect BookFade Account</h3>
                  <p className="text-sm text-text-secondary">Pull your profile info automatically</p>
                </div>
              </div>

              {bookfadeProfile ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-4 mb-4">
                    {bookfadeProfile.profileImage ? (
                      <img
                        src={bookfadeProfile.profileImage}
                        alt={bookfadeProfile.name}
                        className="w-14 h-14 rounded-full object-cover border-2"
                        style={{ borderColor: bookfadeProfile.themeColor || '#9a58fd' }}
                      />
                    ) : (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: bookfadeProfile.themeColor || '#9a58fd' }}
                      >
                        {bookfadeProfile.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-green-500">Connected</p>
                      <p className="font-medium">{bookfadeProfile.name}</p>
                      <p className="text-sm text-text-secondary">
                        bookfade.app/b/{bookfadeProfile.slug}
                      </p>
                    </div>
                    <button
                      onClick={disconnectBookFade}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Disconnect
                    </button>
                  </div>

                  {/* Profile Data Preview */}
                  <div className="text-sm space-y-1 text-text-secondary border-t border-green-500/20 pt-3 mt-3">
                    <p><span className="text-text-primary">Shop:</span> {bookfadeProfile.businessName || 'Not set'}</p>
                    <p><span className="text-text-primary">Location:</span> {bookfadeProfile.businessCity ? `${bookfadeProfile.businessCity}, ${bookfadeProfile.businessState}` : 'Not set'}</p>
                    <p><span className="text-text-primary">Theme Color:</span> <span style={{ color: bookfadeProfile.themeColor || '#9a58fd' }}>{bookfadeProfile.themeColor || '#9a58fd'}</span></p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
                        bookfade.app/b/
                      </span>
                      <input
                        type="text"
                        value={bookfadeSlug}
                        onChange={(e) => setBookfadeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        placeholder="username"
                        className="w-full pl-[120px] pr-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && connectBookFade()}
                      />
                    </div>
                    <button
                      onClick={connectBookFade}
                      disabled={fetchingProfile}
                      className="px-6 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 font-medium"
                    >
                      {fetchingProfile ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                  {connectionError && (
                    <p className="text-red-400 text-sm mt-2">{connectionError}</p>
                  )}
                  <p className="text-xs text-text-secondary mt-2">
                    Don't have a BookFade account? <a href="https://bookfade.app" target="_blank" className="text-accent hover:underline">Sign up free</a>
                  </p>
                </div>
              )}
            </div>

            {/* Customization Form */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Customize Your Card Holder</h3>

              {/* Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Your Name *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Kyle Rivers"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              {/* Shop Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Shop/Business Name (optional)</label>
                <input
                  type="text"
                  value={customShopName}
                  onChange={(e) => setCustomShopName(e.target.value)}
                  placeholder="King's Grooming Lounge"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              {/* Logo Option */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Logo</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUseBookFadeLogo(true)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      useBookFadeLogo ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="font-medium">BookFade Logo</span>
                    <p className="text-xs text-text-secondary mt-1">Standard</p>
                  </button>
                  <button
                    onClick={() => setUseBookFadeLogo(false)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      !useBookFadeLogo ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="font-medium">Custom Logo</span>
                    <p className="text-xs text-text-secondary mt-1">+$10 setup</p>
                  </button>
                </div>
                {!useBookFadeLogo && (
                  <input
                    type="url"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://yoursite.com/logo.png"
                    className="w-full mt-3 px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                  />
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Quantity</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 hover:bg-surface transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 min-w-[50px] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 hover:bg-surface transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-text-secondary">
                    First unit includes setup fee. Additional units are discounted.
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-text-secondary mb-1">Special Instructions (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Price & Checkout */}
            <div className="bg-surface rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-text-secondary">Total</span>
                <span className="text-3xl font-bold">${totalPrice.toFixed(2)}</span>
              </div>

              {quantity > 1 && (
                <p className="text-sm text-text-secondary mb-4">
                  1x ${Number(product.price).toFixed(2)} + {quantity - 1}x discounted = ${totalPrice.toFixed(2)}
                </p>
              )}

              <button
                onClick={handleAddToCart}
                disabled={!customName || addingToCart}
                className="w-full py-4 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {addingToCart ? 'Processing...' : `Buy Now - $${totalPrice.toFixed(2)}`}
              </button>

              {!customName && (
                <p className="text-sm text-red-400 mt-2 text-center">Please enter your name</p>
              )}

              <p className="text-xs text-text-secondary mt-4 text-center">
                Ships in 5-7 business days. Free shipping over $50.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

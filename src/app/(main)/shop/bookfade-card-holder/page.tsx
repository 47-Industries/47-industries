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

const HOLDER_OPTIONS = [
  {
    id: 'bookfade',
    name: 'BookFade Logo',
    price: 24.99,
    additionalPrice: 14.99,
    description: 'Pre-designed with BookFade branding',
    badge: 'Fastest',
  },
  {
    id: 'custom-simple',
    name: 'Custom Logo (1-2 Colors)',
    price: 34.99,
    additionalPrice: 19.99,
    description: 'Your logo or design included',
    badge: null,
  },
  {
    id: 'custom-multi',
    name: 'Custom Logo (Multi-Color)',
    price: 44.99,
    additionalPrice: 24.99,
    description: 'Complex multi-color designs',
    badge: 'Premium',
  },
]

export default function BookFadeCardHolderPage() {
  const router = useRouter()
  const { addItem } = useCart()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  // BookFade connection
  const [bookfadeSlug, setBookfadeSlug] = useState('')
  const [bookfadeProfile, setBookfadeProfile] = useState<BookFadeProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  // Customization
  const [selectedOption, setSelectedOption] = useState('bookfade')
  const [quantity, setQuantity] = useState(1)
  const [customName, setCustomName] = useState('')
  const [customShopName, setCustomShopName] = useState('')
  const [customLogoUrl, setCustomLogoUrl] = useState('')
  const [notes, setNotes] = useState('')

  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [])

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
      }
    } catch (error) {
      console.error('Error:', error)
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
      const res = await fetch(`/api/bookfade/lookup?slug=${bookfadeSlug.trim()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.barber) {
          setBookfadeProfile(data.barber)
        } else {
          setConnectionError('No BookFade account found')
        }
      } else {
        setConnectionError('Failed to connect')
      }
    } catch {
      setConnectionError('Failed to connect')
    }
    setFetchingProfile(false)
  }

  function getPrice() {
    const option = HOLDER_OPTIONS.find(o => o.id === selectedOption)
    if (!option) return 24.99
    if (quantity === 1) return option.price
    return option.price + (option.additionalPrice * (quantity - 1))
  }

  async function handleBuyNow() {
    if (!product || !customName) return
    setAddingToCart(true)

    const option = HOLDER_OPTIONS.find(o => o.id === selectedOption)

    addItem({
      productId: product.id,
      name: `BookFade Card Holder - ${option?.name || 'Standard'}`,
      price: getPrice(),
      image: product.images?.[0] || null,
      quantity: 1,
      productType: 'PHYSICAL',
      customization: {
        holderType: selectedOption,
        orderQuantity: quantity,
        name: customName,
        shopName: customShopName,
        bookfadeSlug: bookfadeProfile?.slug || null,
        bookfadeId: bookfadeProfile?.id || null,
        customLogoUrl: selectedOption !== 'bookfade' ? customLogoUrl : null,
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

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-text-secondary">
          <Link href="/shop" className="hover:text-text-primary">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">BookFade Card Holder</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Product Images */}
          <div>
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative sticky top-24">
              {product?.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt="BookFade Card Holder"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-violet-500/20 to-blue-500/20">
                  <div className="text-center p-8">
                    <div className="w-32 h-24 bg-zinc-800 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <div className="w-16 h-12 bg-zinc-700 rounded" />
                    </div>
                    <p className="text-text-secondary">3D Printed Card Holder</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="text-4xl font-bold mb-3">BookFade Card Holder</h1>
            <p className="text-lg text-text-secondary mb-6">
              Custom 3D printed business card holder for your barber station
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-bold">${getPrice().toFixed(2)}</span>
              {quantity > 1 && (
                <span className="text-text-secondary">
                  for {quantity} units
                </span>
              )}
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Ships in 3-5 days</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span>Premium PLA+</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <span>Holds 50+ cards</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span>Made in-house</span>
              </div>
            </div>

            {/* Design Option */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Design Option</label>
              <div className="space-y-3">
                {HOLDER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedOption === option.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          {option.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              option.badge === 'Fastest' ? 'bg-green-500/20 text-green-500' : 'bg-violet-500/20 text-violet-500'
                            }`}>
                              {option.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{option.description}</p>
                      </div>
                      <span className="font-bold">${option.price.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-surface transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="px-6 py-3 min-w-[60px] text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 hover:bg-surface transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
                {quantity > 1 && (
                  <p className="text-sm text-green-500">
                    Additional units at reduced price
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-8" />

            {/* BookFade Connection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Personalization</h3>

              {bookfadeProfile ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {bookfadeProfile.profileImage ? (
                        <img
                          src={bookfadeProfile.profileImage}
                          alt={bookfadeProfile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: bookfadeProfile.themeColor || '#9a58fd' }}
                        >
                          {bookfadeProfile.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-green-500 text-xs font-medium">BookFade Connected</p>
                        <p className="font-medium">{bookfadeProfile.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBookfadeProfile(null)
                        setBookfadeSlug('')
                      }}
                      className="text-sm text-text-secondary hover:text-red-400"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-surface rounded-xl p-4 mb-4 border border-border">
                  <p className="text-sm text-text-secondary mb-3">
                    Connect your BookFade to auto-fill your info
                  </p>
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
                        className="w-full pl-[115px] pr-4 py-2.5 bg-background border border-border rounded-lg focus:border-violet-500 focus:outline-none text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && connectBookFade()}
                      />
                    </div>
                    <button
                      onClick={connectBookFade}
                      disabled={fetchingProfile}
                      className="px-4 py-2.5 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 text-sm font-medium"
                    >
                      {fetchingProfile ? '...' : 'Connect'}
                    </button>
                  </div>
                  {connectionError && <p className="text-red-400 text-sm mt-2">{connectionError}</p>}
                </div>
              )}

              {/* Name Input */}
              <div className="mb-4">
                <label className="block text-sm text-text-secondary mb-1.5">Your Name *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Kyle Rivers"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              {/* Shop Name Input */}
              <div className="mb-4">
                <label className="block text-sm text-text-secondary mb-1.5">Shop Name (optional)</label>
                <input
                  type="text"
                  value={customShopName}
                  onChange={(e) => setCustomShopName(e.target.value)}
                  placeholder="King's Grooming Lounge"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                />
              </div>

              {/* Custom Logo URL - only for custom options */}
              {selectedOption !== 'bookfade' && (
                <div className="mb-4">
                  <label className="block text-sm text-text-secondary mb-1.5">Logo URL (optional)</label>
                  <input
                    type="url"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://yoursite.com/logo.png"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Or email your logo to orders@47industries.com after checkout
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Special Instructions (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests..."
                  rows={2}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuyNow}
              disabled={!customName || addingToCart}
              className="w-full py-4 bg-accent text-white rounded-xl font-semibold text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addingToCart ? 'Processing...' : `Buy Now - $${getPrice().toFixed(2)}`}
            </button>

            {!customName && (
              <p className="text-sm text-red-400 mt-2 text-center">Please enter your name</p>
            )}

            <p className="text-xs text-text-secondary mt-4 text-center">
              Free shipping on orders over $50
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-store'

interface BookFadeProfile {
  id: string
  name: string
  slug: string
  businessName: string | null
  businessPhone: string | null
  businessAddress: string | null
  businessCity: string | null
  businessState: string | null
  profileImage: string | null
  themeColor: string | null
  bio: string | null
  socialInstagram: string | null
}

const HOLDER_COLORS = [
  { id: 'black', name: 'Black', hex: '#1a1a1a', price: 59.99 },
  { id: 'white', name: 'White', hex: '#f5f5f5', price: 59.99 },
  { id: 'gold', name: 'Gold', hex: '#d4af37', price: 64.99 },
]

const THEME_COLORS = [
  '#9a58fd', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
]

export default function BookFadeStarterBundlePage() {
  const router = useRouter()
  const { addItem } = useCart()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  // BookFade connection
  const [bookfadeSlug, setBookfadeSlug] = useState('')
  const [bookfadeProfile, setBookfadeProfile] = useState<BookFadeProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [manualEntry, setManualEntry] = useState(false)

  // Customization
  const [holderColor, setHolderColor] = useState('black')
  const [customName, setCustomName] = useState('')
  const [customTagline, setCustomTagline] = useState('')
  const [customShopName, setCustomShopName] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [customState, setCustomState] = useState('')
  const [themeColor, setThemeColor] = useState('#9a58fd')

  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [])

  useEffect(() => {
    if (bookfadeProfile) {
      setCustomName(bookfadeProfile.name || '')
      setCustomTagline(bookfadeProfile.bio?.slice(0, 50) || '')
      setCustomShopName(bookfadeProfile.businessName || '')
      setCustomCity(bookfadeProfile.businessCity || '')
      setCustomState(bookfadeProfile.businessState || '')
      setThemeColor(bookfadeProfile.themeColor || '#9a58fd')
    }
  }, [bookfadeProfile])

  async function fetchProduct() {
    try {
      const res = await fetch('/api/products/bookfade-starter-bundle')
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
          setManualEntry(false)
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
    return HOLDER_COLORS.find(c => c.id === holderColor)?.price || 59.99
  }

  async function handleBuyNow() {
    if (!product || !customName) return
    setAddingToCart(true)

    const selectedHolder = HOLDER_COLORS.find(c => c.id === holderColor)

    addItem({
      productId: product.id,
      name: `BookFade Starter Bundle - ${selectedHolder?.name} Holder`,
      price: getPrice(),
      image: product.images?.[0] || null,
      quantity: 1,
      productType: 'PHYSICAL',
      customization: {
        bundleContents: ['500 Business Cards', `Card Holder (${holderColor})`],
        holderColor,
        name: customName,
        tagline: customTagline,
        shopName: customShopName,
        city: customCity,
        state: customState,
        themeColor,
        bookfadeSlug: bookfadeProfile?.slug || null,
        bookfadeId: bookfadeProfile?.id || null,
        profileImage: bookfadeProfile?.profileImage || null,
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
          <span className="text-text-primary">BookFade Starter Bundle</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Bundle Preview */}
          <div className="sticky top-24 self-start">
            {/* Bundle Hero */}
            <div className="bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-2xl p-8 mb-6">
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-1.5 bg-green-500/20 text-green-500 rounded-full text-sm font-semibold mb-4">
                  Save $10 vs buying separately
                </span>
                <h2 className="text-2xl font-bold">Everything You Need</h2>
              </div>

              {/* Bundle Items */}
              <div className="space-y-4">
                <div className="bg-background/50 rounded-xl p-4 flex items-center gap-4">
                  <div
                    className="w-16 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: themeColor }}
                  >
                    500
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">500 Business Cards</p>
                    <p className="text-sm text-text-secondary">Double-sided, full color, QR code</p>
                  </div>
                  <span className="text-text-secondary line-through">$47.99</span>
                </div>

                <div className="bg-background/50 rounded-xl p-4 flex items-center gap-4">
                  <div
                    className="w-16 h-10 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: HOLDER_COLORS.find(c => c.id === holderColor)?.hex,
                      border: holderColor === 'white' ? '1px solid #ccc' : 'none'
                    }}
                  >
                    <div className="w-8 h-5 bg-white/20 rounded" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Card Holder</p>
                    <p className="text-sm text-text-secondary">3D printed, {HOLDER_COLORS.find(c => c.id === holderColor)?.name}</p>
                  </div>
                  <span className="text-text-secondary line-through">$24.99</span>
                </div>
              </div>

              {/* Bundle Total */}
              <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center">
                <div>
                  <span className="text-text-secondary">Bundle Price</span>
                  <p className="text-sm text-text-secondary">Ships together</p>
                </div>
                <div className="text-right">
                  <span className="text-text-secondary line-through mr-3">$72.98</span>
                  <span className="text-3xl font-bold text-green-500">${getPrice()}</span>
                </div>
              </div>
            </div>

            {/* Holder Color Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Holder Color</label>
              <div className="grid grid-cols-3 gap-3">
                {HOLDER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setHolderColor(color.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      holderColor === color.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2"
                      style={{
                        backgroundColor: color.hex,
                        border: color.id === 'white' ? '1px solid #ccc' : 'none'
                      }}
                    />
                    <p className="font-medium text-sm">{color.name}</p>
                    {color.price > 59.99 && (
                      <p className="text-xs text-accent">+$5</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Product Info & Form */}
          <div>
            <h1 className="text-4xl font-bold mb-3">BookFade Starter Bundle</h1>
            <p className="text-lg text-text-secondary mb-6">
              Everything you need to promote your booking page
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-bold">${getPrice()}</span>
              <span className="text-text-secondary line-through">$72.98</span>
              <span className="text-green-500 font-medium">Save $13</span>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Free shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span>Ships in 5-7 days</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-8" />

            {/* BookFade Connection or Manual Entry */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Card Information</h3>

              {!bookfadeProfile && !manualEntry && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setManualEntry(false)}
                    className="p-4 rounded-xl border-2 border-violet-500 bg-violet-500/10 text-center"
                  >
                    <p className="font-medium">Connect BookFade</p>
                    <p className="text-xs text-text-secondary mt-1">Auto-fill your info</p>
                  </button>
                  <button
                    onClick={() => setManualEntry(true)}
                    className="p-4 rounded-xl border-2 border-border hover:border-accent/50 text-center transition-colors"
                  >
                    <p className="font-medium">Enter Manually</p>
                    <p className="text-xs text-text-secondary mt-1">Type it in</p>
                  </button>
                </div>
              )}

              {/* BookFade Connection */}
              {!bookfadeProfile && !manualEntry && (
                <div className="bg-surface rounded-xl p-4 border border-border">
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

              {/* Connected Profile */}
              {bookfadeProfile && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: bookfadeProfile.themeColor || '#9a58fd' }}
                      >
                        {bookfadeProfile.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-green-500 text-xs font-medium">Connected</p>
                        <p className="font-medium">{bookfadeProfile.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setBookfadeProfile(null)
                        setBookfadeSlug('')
                      }}
                      className="text-sm text-red-400"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              {(manualEntry || bookfadeProfile) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Kyle Rivers"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Tagline</label>
                    <input
                      type="text"
                      value={customTagline}
                      onChange={(e) => setCustomTagline(e.target.value)}
                      placeholder="Custom Fades & Beards"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Shop Name</label>
                    <input
                      type="text"
                      value={customShopName}
                      onChange={(e) => setCustomShopName(e.target.value)}
                      placeholder="King's Grooming Lounge"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">City</label>
                      <input
                        type="text"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="Los Angeles"
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-1.5">State</label>
                      <input
                        type="text"
                        value={customState}
                        onChange={(e) => setCustomState(e.target.value.toUpperCase())}
                        placeholder="CA"
                        maxLength={2}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Theme Color */}
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">Card Theme Color</label>
                    <div className="flex gap-2">
                      {THEME_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className="w-10 h-10 rounded-lg transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            border: themeColor === color ? '3px solid white' : 'none',
                            boxShadow: themeColor === color ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Buy Button */}
            {(manualEntry || bookfadeProfile) && (
              <>
                <button
                  onClick={handleBuyNow}
                  disabled={!customName || addingToCart}
                  className="w-full py-4 bg-accent text-white rounded-xl font-semibold text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingToCart ? 'Processing...' : `Buy Bundle - $${getPrice()}`}
                </button>

                {!customName && (
                  <p className="text-sm text-red-400 mt-2 text-center">Please enter your name</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

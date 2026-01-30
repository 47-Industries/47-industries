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

const QUANTITY_OPTIONS = [
  { qty: 250, price: 35.99 },
  { qty: 500, price: 47.99 },
  { qty: 1000, price: 71.99 },
]

const FINISH_OPTIONS = [
  { id: '14pt_gloss', name: 'Gloss UV', description: 'Shiny, vibrant finish' },
  { id: '14pt_matte', name: 'Matte', description: 'Smooth, elegant feel' },
  { id: '16pt_silk', name: 'Silk Laminated', description: 'Premium soft-touch' },
]

const THEME_COLORS = [
  '#9a58fd', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
]

export default function BookFadeBusinessCardsPage() {
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
  const [selectedQty, setSelectedQty] = useState(500)
  const [selectedFinish, setSelectedFinish] = useState('14pt_gloss')
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
      const res = await fetch('/api/products/bookfade-business-cards')
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
      const res = await fetch(`/api/admin/bookfade/barbers?slug=${bookfadeSlug.trim()}`)
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
    return QUANTITY_OPTIONS.find(o => o.qty === selectedQty)?.price || 47.99
  }

  async function handleBuyNow() {
    if (!product || !customName) return
    setAddingToCart(true)

    const finish = FINISH_OPTIONS.find(f => f.id === selectedFinish)

    addItem({
      productId: product.id,
      name: `BookFade Business Cards - ${selectedQty} qty`,
      price: getPrice(),
      image: product.images?.[0] || null,
      quantity: 1,
      productType: 'PHYSICAL',
      customization: {
        quantity: selectedQty,
        finish: selectedFinish,
        finishName: finish?.name,
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
          <span className="text-text-primary">BookFade Business Cards</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left: Card Preview */}
          <div className="sticky top-24 self-start">
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center">
              {/* Card Preview */}
              <div className="w-full max-w-sm">
                {/* Front of Card */}
                <div
                  className="aspect-[1.75/1] rounded-lg shadow-2xl p-4 flex flex-col justify-between mb-4 transition-colors"
                  style={{ backgroundColor: themeColor }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold text-lg">{customName || 'Your Name'}</p>
                      <p className="text-white/80 text-xs">{customTagline || 'Your Tagline'}</p>
                    </div>
                    <div className="w-10 h-10 bg-white/20 rounded-full" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-medium">{customShopName || 'Shop Name'}</p>
                    <p className="text-white/70 text-xs">{customCity || 'City'}, {customState || 'ST'}</p>
                  </div>
                </div>

                {/* Back of Card */}
                <div className="aspect-[1.75/1] rounded-lg shadow-2xl bg-zinc-900 p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-xl flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold" style={{ color: themeColor }}>QR</span>
                  </div>
                  <p className="text-white text-sm font-medium">Book with BookFade</p>
                  <p className="text-zinc-500 text-xs mt-1">bookfade.app/b/{bookfadeProfile?.slug || 'username'}</p>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-text-secondary mt-4">
              Live preview updates as you customize
            </p>
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="text-4xl font-bold mb-3">BookFade Business Cards</h1>
            <p className="text-lg text-text-secondary mb-6">
              Premium double-sided cards with your QR code booking link
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-bold">${getPrice().toFixed(2)}</span>
              <span className="text-text-secondary">
                for {selectedQty} cards
              </span>
            </div>

            {/* Quantity Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Quantity</label>
              <div className="grid grid-cols-3 gap-3">
                {QUANTITY_OPTIONS.map((option) => (
                  <button
                    key={option.qty}
                    onClick={() => setSelectedQty(option.qty)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      selectedQty === option.qty
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="block text-2xl font-bold">{option.qty}</span>
                    <span className="text-sm text-text-secondary">${option.price}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Finish Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Card Finish</label>
              <div className="grid grid-cols-3 gap-3">
                {FINISH_OPTIONS.map((finish) => (
                  <button
                    key={finish.id}
                    onClick={() => setSelectedFinish(finish.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedFinish === finish.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <span className="block font-medium text-sm">{finish.name}</span>
                    <span className="text-xs text-text-secondary">{finish.description}</span>
                  </button>
                ))}
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
                  {addingToCart ? 'Processing...' : `Buy Now - $${getPrice().toFixed(2)}`}
                </button>

                {!customName && (
                  <p className="text-sm text-red-400 mt-2 text-center">Please enter your name</p>
                )}

                <p className="text-xs text-text-secondary mt-4 text-center">
                  Ships in 5-7 business days
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

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
  businessPhone: string | null
  businessAddress: string | null
  businessCity: string | null
  businessState: string | null
  profileImage: string | null
  themeColor: string | null
  bio: string | null
  socialInstagram: string | null
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
  }>
}

const QUANTITY_OPTIONS = [
  { qty: 250, price: 29.99, perCard: 0.12 },
  { qty: 500, price: 44.99, perCard: 0.09 },
  { qty: 1000, price: 64.99, perCard: 0.065 },
]

export default function BookFadeBusinessCardsPage() {
  const router = useRouter()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // BookFade connection
  const [bookfadeSlug, setBookfadeSlug] = useState('')
  const [bookfadeProfile, setBookfadeProfile] = useState<BookFadeProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [connectionError, setConnectionError] = useState('')
  const [manualEntry, setManualEntry] = useState(false)

  // Card customization
  const [selectedQty, setSelectedQty] = useState(500)
  const [customName, setCustomName] = useState('')
  const [customTagline, setCustomTagline] = useState('')
  const [customShopName, setCustomShopName] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [customState, setCustomState] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customInstagram, setCustomInstagram] = useState('')
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
      setCustomAddress(bookfadeProfile.businessAddress || '')
      setCustomCity(bookfadeProfile.businessCity || '')
      setCustomState(bookfadeProfile.businessState || '')
      setCustomPhone(bookfadeProfile.businessPhone || '')
      setCustomInstagram(bookfadeProfile.socialInstagram || '')
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

  function disconnectBookFade() {
    setBookfadeProfile(null)
    setBookfadeSlug('')
  }

  function getSelectedPrice() {
    return QUANTITY_OPTIONS.find(o => o.qty === selectedQty)?.price || 44.99
  }

  async function handleBuyNow() {
    if (!product || !customName) return
    setAddingToCart(true)

    const variant = product.variants?.find(v => v.name.includes(String(selectedQty)))

    addItem({
      productId: product.id,
      variantId: variant?.id,
      name: `BookFade Business Cards - ${selectedQty}`,
      price: getSelectedPrice(),
      image: product.images?.[0] || null,
      quantity: 1,
      productType: 'PHYSICAL',
      customization: {
        quantity: selectedQty,
        name: customName,
        tagline: customTagline,
        shopName: customShopName,
        address: customAddress,
        city: customCity,
        state: customState,
        phone: customPhone,
        instagram: customInstagram,
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
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <nav className="mb-8 text-sm text-text-secondary">
          <Link href="/shop" className="hover:text-text-primary">Shop</Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">BookFade Business Cards</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Preview */}
          <div>
            <div className="aspect-[1.75/1] bg-black rounded-2xl overflow-hidden relative mb-4 shadow-2xl">
              {/* Live Card Preview */}
              <div className="w-full h-full p-4 flex flex-col justify-between text-white" style={{ background: `linear-gradient(145deg, rgba(0,0,0,0.9) 0%, ${themeColor}30 100%)` }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: themeColor, border: `2px solid ${themeColor}` }}
                  >
                    {customName.charAt(0) || 'Y'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{customName || 'Your Name'}</h3>
                    <p className="text-xs uppercase tracking-wider" style={{ color: themeColor }}>
                      {customTagline || 'Professional Barber'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">{customShopName || 'Your Shop'}</span>
                  <div className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: themeColor }}>
                    Book Online
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-text-secondary">Live preview - your card will look like this</p>

            {/* Quantity Selection */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {QUANTITY_OPTIONS.map((opt) => (
                <button
                  key={opt.qty}
                  onClick={() => setSelectedQty(opt.qty)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedQty === opt.qty
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <p className="font-bold text-xl">{opt.qty}</p>
                  <p className="text-xs text-text-secondary">cards</p>
                  <p className="font-semibold text-accent mt-1">${opt.price}</p>
                  <p className="text-xs text-text-secondary">${opt.perCard}/ea</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div>
            <h1 className="text-3xl font-bold mb-2">BookFade Business Cards</h1>
            <p className="text-text-secondary mb-6">Professional cards with your booking link and QR code</p>

            {/* Connection Options */}
            {!bookfadeProfile && !manualEntry && (
              <div className="bg-surface rounded-xl p-6 mb-6 border border-border">
                <h3 className="font-semibold mb-4">How would you like to enter your info?</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setManualEntry(false)}
                    className="p-4 rounded-lg border-2 border-violet-500 bg-violet-500/10 text-center"
                  >
                    <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <p className="font-medium">Connect BookFade</p>
                    <p className="text-xs text-text-secondary mt-1">Auto-fill from your profile</p>
                  </button>
                  <button
                    onClick={() => setManualEntry(true)}
                    className="p-4 rounded-lg border-2 border-border hover:border-accent/50 text-center transition-colors"
                  >
                    <div className="w-10 h-10 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <p className="font-medium">Enter Manually</p>
                    <p className="text-xs text-text-secondary mt-1">Type your info</p>
                  </button>
                </div>

                {/* BookFade Connect Form */}
                <div className="mt-4">
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
                        className="w-full pl-[120px] pr-4 py-3 bg-background border border-border rounded-lg focus:border-violet-500 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && connectBookFade()}
                      />
                    </div>
                    <button
                      onClick={connectBookFade}
                      disabled={fetchingProfile}
                      className="px-6 py-3 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 font-medium"
                    >
                      {fetchingProfile ? '...' : 'Connect'}
                    </button>
                  </div>
                  {connectionError && <p className="text-red-400 text-sm mt-2">{connectionError}</p>}
                </div>
              </div>
            )}

            {/* Connected Profile */}
            {bookfadeProfile && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: bookfadeProfile.themeColor || '#9a58fd' }}>
                      {bookfadeProfile.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-green-500 text-sm font-medium">Connected to BookFade</p>
                      <p className="font-medium">{bookfadeProfile.name}</p>
                    </div>
                  </div>
                  <button onClick={disconnectBookFade} className="text-sm text-red-400 hover:text-red-300">
                    Disconnect
                  </button>
                </div>
                <div className="text-sm text-text-secondary grid grid-cols-2 gap-2">
                  <p>Shop: {bookfadeProfile.businessName || 'Not set'}</p>
                  <p>Location: {bookfadeProfile.businessCity || 'Not set'}</p>
                </div>
              </div>
            )}

            {/* Manual Entry Form */}
            {(manualEntry || bookfadeProfile) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Card Information</h3>
                  {manualEntry && !bookfadeProfile && (
                    <button onClick={() => setManualEntry(false)} className="text-sm text-accent hover:underline">
                      Connect BookFade instead
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Your Name *</label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Kyle Rivers"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Tagline</label>
                    <input
                      type="text"
                      value={customTagline}
                      onChange={(e) => setCustomTagline(e.target.value)}
                      placeholder="Custom Fades & Beards"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Shop/Business Name</label>
                    <input
                      type="text"
                      value={customShopName}
                      onChange={(e) => setCustomShopName(e.target.value)}
                      placeholder="King's Grooming Lounge"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm text-text-secondary mb-1">Address</label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="123 Main St"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">City</label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="Los Angeles"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">State</label>
                    <input
                      type="text"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value.toUpperCase())}
                      placeholder="CA"
                      maxLength={2}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Phone</label>
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1">Instagram</label>
                    <input
                      type="text"
                      value={customInstagram}
                      onChange={(e) => setCustomInstagram(e.target.value.replace('@', ''))}
                      placeholder="username"
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Theme Color */}
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Theme Color</label>
                  <div className="flex gap-2">
                    {['#9a58fd', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setThemeColor(color)}
                        className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          border: themeColor === color ? '2px solid white' : '2px solid transparent',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Checkout */}
            {(manualEntry || bookfadeProfile) && (
              <div className="mt-8 bg-surface rounded-xl p-6 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-text-secondary">{selectedQty} Business Cards</p>
                    <p className="text-sm text-text-secondary">Double-sided, full color, QR code included</p>
                  </div>
                  <span className="text-3xl font-bold">${getSelectedPrice().toFixed(2)}</span>
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={!customName || addingToCart}
                  className="w-full py-4 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingToCart ? 'Processing...' : `Buy Now - $${getSelectedPrice().toFixed(2)}`}
                </button>

                {!customName && (
                  <p className="text-sm text-red-400 mt-2 text-center">Please enter your name</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

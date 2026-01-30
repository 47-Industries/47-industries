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
  heroImage: string | null
  heroTitle: string | null
  galleryImages: string[]
  themeColor: string | null
  bio: string | null
  socialInstagram: string | null
  allowWalkIns: boolean
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
  const [customAddress, setCustomAddress] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [customState, setCustomState] = useState('')
  const [customProfileImage, setCustomProfileImage] = useState('')
  const [customBackgroundImage, setCustomBackgroundImage] = useState('')
  const [themeColor, setThemeColor] = useState('#9a58fd')
  const [allowWalkIns, setAllowWalkIns] = useState(true)

  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [])

  useEffect(() => {
    if (bookfadeProfile) {
      setCustomName(bookfadeProfile.name || '')
      setCustomTagline(bookfadeProfile.heroTitle || '')
      setCustomShopName(bookfadeProfile.businessName || '')
      setCustomAddress(bookfadeProfile.businessAddress || '')
      setCustomCity(bookfadeProfile.businessCity || '')
      setCustomState(bookfadeProfile.businessState || '')
      setCustomProfileImage(bookfadeProfile.profileImage || '')
      // Use heroImage or first gallery image as background
      const bgImage = bookfadeProfile.heroImage || bookfadeProfile.galleryImages?.[0] || ''
      setCustomBackgroundImage(bgImage)
      setThemeColor(bookfadeProfile.themeColor || '#9a58fd')
      setAllowWalkIns(bookfadeProfile.allowWalkIns ?? true)
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
        address: customAddress,
        city: customCity,
        state: customState,
        themeColor,
        bookfadeSlug: bookfadeProfile?.slug || bookfadeSlug || null,
        bookfadeId: bookfadeProfile?.id || null,
        profileImage: customProfileImage || null,
        backgroundImage: customBackgroundImage || null,
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
          <div className="sticky top-24 self-start space-y-6">
            {/* Front of Card */}
            <div>
              <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Front</p>
              <div className="aspect-[1.67/1] rounded-lg shadow-2xl overflow-hidden relative bg-black p-[3px]">
                <div className="w-full h-full relative overflow-hidden">
                  {/* Background image */}
                  <img
                    src={customBackgroundImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80'}
                    alt=""
                    className="absolute object-cover opacity-[0.45]"
                    style={{
                      top: '-10%',
                      left: '-10%',
                      width: '120%',
                      height: '120%',
                    }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(145deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 100%)',
                    }}
                  />

                  {/* Card content */}
                  <div
                    className="relative z-10 h-full flex flex-col justify-between"
                    style={{ padding: '18px 22px' }}
                  >
                    {/* Top: Profile + Name */}
                    <div className="flex items-start" style={{ gap: '14px' }}>
                      {/* Profile photo - 58px */}
                      <div
                        className="rounded-full flex-shrink-0 overflow-hidden"
                        style={{
                          width: '58px',
                          height: '58px',
                          border: `2.5px solid ${themeColor}`,
                        }}
                      >
                        {customProfileImage ? (
                          <img
                            src={customProfileImage}
                            alt={customName || 'Profile'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: themeColor }}
                          >
                            {customName ? customName.charAt(0) : '?'}
                          </div>
                        )}
                      </div>

                      {/* Name + Tagline */}
                      <div className="flex-1 min-w-0" style={{ paddingTop: '4px' }}>
                        <h3
                          className="text-white font-bold leading-tight"
                          style={{ fontSize: '22px', letterSpacing: '-0.3px', marginBottom: '3px' }}
                        >
                          {customName || 'Your Name'}
                        </h3>
                        <p
                          className="font-semibold uppercase truncate"
                          style={{ fontSize: '10px', letterSpacing: '2px', color: themeColor }}
                        >
                          {customTagline || 'Your Tagline'}
                        </p>
                        <p
                          className="uppercase"
                          style={{ fontSize: '8px', letterSpacing: '1px', color: '#71717a', marginTop: '4px' }}
                        >
                          {allowWalkIns ? 'Walk-ins Welcome' : 'By Appointment Only'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Shop name + location + Book button */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p
                          className="font-medium"
                          style={{ fontSize: '12px', color: '#a1a1aa' }}
                        >
                          {customShopName || 'Your Barber Shop'}
                        </p>
                        <p style={{ fontSize: '10px', color: '#71717a' }}>
                          {customCity || 'City'}, {customState || 'ST'}
                        </p>
                      </div>
                      <div
                        className="font-semibold text-white"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          backgroundColor: themeColor,
                        }}
                      >
                        Book Online
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back of Card */}
            <div>
              <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Back</p>
              <div className="aspect-[1.67/1] rounded-lg shadow-2xl overflow-hidden bg-[#0a0a0a] p-1">
                <div className="w-full h-full bg-[#18181b] border border-zinc-800 rounded flex items-center justify-between px-5 py-4 gap-5">
                  {/* Left side - Info */}
                  <div className="flex flex-col justify-center gap-4">
                    <div>
                      <h3 className="text-[13px] font-semibold text-white mb-1">
                        {customShopName || 'Your Barber Shop'}
                      </h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {customAddress && <>{customAddress}<br /></>}
                        {customCity || 'City'}, {customState || 'ST'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-[1.2px]">
                        Book Your Appointment
                      </span>
                      <span className="text-sm font-semibold" style={{ color: themeColor }}>
                        bookfade.app/b/{bookfadeProfile?.slug || bookfadeSlug || 'username'}
                      </span>
                    </div>
                  </div>

                  {/* Right side - QR Code */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-20 h-20 bg-white rounded-lg p-1">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://bookfade.app/b/${bookfadeProfile?.slug || bookfadeSlug || 'username'}`)}&format=png`}
                        alt="QR Code"
                        className="w-full h-full rounded"
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-[1px]">
                      Scan to Book
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Image Field */}
            {(manualEntry || bookfadeProfile) && (
              <div className="bg-surface rounded-xl p-4 border border-border">
                <label className="block text-sm text-text-secondary mb-1.5">Background Image URL</label>
                <input
                  type="url"
                  value={customBackgroundImage}
                  onChange={(e) => setCustomBackgroundImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:border-accent focus:outline-none text-sm"
                />
                <p className="text-xs text-text-secondary mt-1">Auto-filled from your BookFade gallery</p>
              </div>
            )}

            <p className="text-center text-sm text-text-secondary">
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
                        {bookfadeProfile.businessName && (
                          <p className="text-sm text-text-secondary">{bookfadeProfile.businessName}</p>
                        )}
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

                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Street Address</label>
                    <input
                      type="text"
                      value={customAddress}
                      onChange={(e) => setCustomAddress(e.target.value)}
                      placeholder="123 Main Street"
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

                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Profile Image URL</label>
                    <input
                      type="url"
                      value={customProfileImage}
                      onChange={(e) => setCustomProfileImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                    />
                    <p className="text-xs text-text-secondary mt-1">Leave blank for initial-only display</p>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">BookFade Username (for QR code)</label>
                    <div className="flex items-center">
                      <span className="text-text-secondary text-sm mr-1">bookfade.app/b/</span>
                      <input
                        type="text"
                        value={bookfadeSlug}
                        onChange={(e) => setBookfadeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        placeholder="username"
                        className="flex-1 px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                        disabled={!!bookfadeProfile}
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

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'
import { getAffiliateCode } from '@/components/affiliate/AffiliateTracker'

interface ShippingInfo {
  email: string
  name: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface ShippingRate {
  id: string
  carrier: string
  service: string
  serviceName: string
  price: number
  deliveryDays: number | null
  minDays?: number
  maxDays?: number
  isRealTime: boolean
  isFreeShipping?: boolean
  freeShippingMin?: number | null
}

interface TaxResult {
  taxAmount: number
  totalTaxRate: number
  appliedRates: { name: string; rate: number; amount: number }[]
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotal, clearCart, isDigitalOnly, hasPhysicalProducts } = useCart()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Shipping rates state
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedShippingId, setSelectedShippingId] = useState('')
  const [loadingRates, setLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState('')
  const [shipmentId, setShipmentId] = useState<string | null>(null)

  // Tax state
  const [taxInfo, setTaxInfo] = useState<TaxResult | null>(null)
  const [loadingTax, setLoadingTax] = useState(false)

  const [shipping, setShipping] = useState<ShippingInfo>({
    email: '',
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShipping(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Check if address is complete for rate calculation
  const isAddressComplete = shipping.address1 && shipping.city && shipping.state && shipping.zipCode

  // For digital-only orders, we don't need shipping
  const digitalOnly = isDigitalOnly()

  // Fetch shipping rates when address is complete (only for physical products)
  const fetchShippingRates = useCallback(async () => {
    if (!isAddressComplete || items.length === 0 || digitalOnly) return

    setLoadingRates(true)
    setRatesError('')

    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shipping: {
            address1: shipping.address1,
            address2: shipping.address2,
            city: shipping.city,
            state: shipping.state,
            zipCode: shipping.zipCode,
            country: shipping.country,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Combine real-time and configured rates
        const allRates = [...(data.rates || []), ...(data.configuredRates || [])]
        // Remove duplicates by id
        const uniqueRates = allRates.filter((rate, index, self) =>
          index === self.findIndex(r => r.id === rate.id)
        )
        setShippingRates(uniqueRates)
        setShipmentId(data.shipmentId)

        // Select first rate by default
        if (uniqueRates.length > 0 && !selectedShippingId) {
          setSelectedShippingId(uniqueRates[0].id)
        }
      } else {
        setRatesError(data.error || 'Failed to get shipping rates')
      }
    } catch (err) {
      console.error('Error fetching shipping rates:', err)
      setRatesError('Failed to connect to shipping service')
    } finally {
      setLoadingRates(false)
    }
  }, [isAddressComplete, items, shipping, selectedShippingId])

  // Fetch tax when address and shipping are complete (or for digital-only orders)
  const fetchTax = useCallback(async () => {
    // For digital orders, we just need email; for physical we need address + shipping
    if (digitalOnly) {
      // Digital orders can skip tax for now or calculate based on email
      // For simplicity, we'll skip tax on digital goods
      setTaxInfo({ taxAmount: 0, totalTaxRate: 0, appliedRates: [] })
      return
    }
    if (!isAddressComplete || !selectedShippingId) return

    setLoadingTax(true)

    try {
      const selectedRate = shippingRates.find(r => r.id === selectedShippingId)
      const shippingCost = selectedRate?.price || 0

      const res = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal: getTotal(),
          shippingCost,
          address: {
            country: shipping.country,
            state: shipping.state,
            city: shipping.city,
            zipCode: shipping.zipCode,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setTaxInfo({
          taxAmount: data.taxAmount || 0,
          totalTaxRate: data.totalTaxRate || 0,
          appliedRates: data.appliedRates || [],
        })
      }
    } catch (err) {
      console.error('Error fetching tax:', err)
    } finally {
      setLoadingTax(false)
    }
  }, [isAddressComplete, selectedShippingId, shippingRates, getTotal, shipping])

  // Debounced fetch for shipping rates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAddressComplete) {
        fetchShippingRates()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [shipping.address1, shipping.city, shipping.state, shipping.zipCode, shipping.country])

  // Fetch tax when shipping rate changes
  useEffect(() => {
    if (selectedShippingId && shippingRates.length > 0) {
      fetchTax()
    }
  }, [selectedShippingId, shippingRates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For physical products, require shipping method
    if (!digitalOnly && !selectedShippingId) {
      setError('Please select a shipping method')
      return
    }

    // For digital products, just require email
    if (!shipping.email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedRate = shippingRates.find(r => r.id === selectedShippingId)

      // Get affiliate code from cookie if present
      const affiliateCode = getAffiliateCode()

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            productType: item.productType,
          })),
          shipping: digitalOnly ? { email: shipping.email, name: shipping.name } : shipping,
          shippingRate: digitalOnly ? null : (selectedRate ? {
            id: selectedRate.id,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            serviceName: selectedRate.serviceName,
            price: selectedRate.price,
            deliveryDays: selectedRate.deliveryDays,
            isRealTime: selectedRate.isRealTime,
          } : null),
          shipmentId: digitalOnly ? null : shipmentId,
          tax: taxInfo?.taxAmount || 0,
          isDigitalOnly: digitalOnly,
          affiliateCode, // Include affiliate code for tracking
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-text-secondary">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="text-6xl mb-4 text-zinc-500">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-text-secondary mb-8">
            Add some products before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = getTotal()
  const selectedRate = shippingRates.find(r => r.id === selectedShippingId)
  const shippingCost = selectedRate?.price || 0
  const taxAmount = taxInfo?.taxAmount || 0
  const total = subtotal + shippingCost + taxAmount

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
          {/* Form */}
          <div>
            {digitalOnly ? (
              <>
                {/* Digital Products Notice */}
                <div className="mb-6 p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div>
                      <h3 className="font-semibold text-violet-400">Digital Download</h3>
                      <p className="text-sm text-text-secondary">
                        You&apos;ll receive download links via email after purchase
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              </>
            ) : (
              <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact - Always Required */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={shipping.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                  placeholder="you@example.com"
                />
                {digitalOnly && (
                  <p className="text-xs text-text-secondary mt-1">
                    Download links will be sent to this email
                  </p>
                )}
              </div>

              <div className={digitalOnly ? '' : 'grid grid-cols-2 gap-4'}>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name {digitalOnly ? '' : '*'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    required={!digitalOnly}
                    value={shipping.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                    placeholder="John Doe"
                  />
                </div>
                {!digitalOnly && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={shipping.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                )}
              </div>

              {/* Address - Only for Physical Products */}
              {!digitalOnly && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      name="address1"
                      required
                      value={shipping.address1}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Apartment, suite, etc.
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={shipping.address2}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={shipping.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={shipping.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                        placeholder="NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        required
                        value={shipping.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Country *
                      </label>
                      <select
                        name="country"
                        value={shipping.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Shipping Method - Only for Physical Products */}
              {!digitalOnly && isAddressComplete && (
                <div className="pt-4 border-t border-border">
                  <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>

                  {loadingRates ? (
                    <div className="flex items-center justify-center py-8 bg-surface rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mr-3"></div>
                      <span className="text-text-secondary">Calculating shipping rates...</span>
                    </div>
                  ) : ratesError ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                      {ratesError}
                      <button
                        type="button"
                        onClick={fetchShippingRates}
                        className="ml-2 underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  ) : shippingRates.length > 0 ? (
                    <div className="space-y-2">
                      {shippingRates.map((rate) => (
                        <label
                          key={rate.id}
                          className={`flex items-center p-4 bg-surface border rounded-lg cursor-pointer transition-colors ${
                            selectedShippingId === rate.id
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={rate.id}
                            checked={selectedShippingId === rate.id}
                            onChange={(e) => setSelectedShippingId(e.target.value)}
                            className="mr-4"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{rate.serviceName}</span>
                              <span className={`font-semibold ${rate.isFreeShipping ? 'text-green-500' : ''}`}>
                                {rate.isFreeShipping ? 'FREE' : `$${rate.price.toFixed(2)}`}
                              </span>
                            </div>
                            <div className="text-sm text-text-secondary">
                              {rate.carrier}
                              {rate.deliveryDays && ` • ${rate.deliveryDays} day${rate.deliveryDays !== 1 ? 's' : ''}`}
                              {rate.minDays && rate.maxDays && ` • ${rate.minDays}-${rate.maxDays} business days`}
                              {rate.isRealTime && (
                                <span className="ml-2 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                  Live Rate
                                </span>
                              )}
                            </div>
                            {rate.isFreeShipping && rate.freeShippingMin && (
                              <div className="text-xs text-green-500 mt-1">
                                Free shipping on orders over ${rate.freeShippingMin}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-surface rounded-lg text-text-secondary text-sm text-center">
                      Enter your full address to see shipping options
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!digitalOnly && !selectedShippingId)}
                className={`w-full py-4 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  digitalOnly
                    ? 'bg-violet-500 hover:bg-violet-600'
                    : 'bg-accent hover:bg-accent/90'
                }`}
              >
                {loading ? 'Processing...' : digitalOnly ? 'Purchase Download' : 'Continue to Payment'}
              </button>

              <p className="text-xs text-text-secondary text-center">
                You&apos;ll be redirected to Stripe to complete your payment securely.
                {digitalOnly && ' Download links will be sent to your email.'}
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="w-16 h-16 bg-surface rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                          No Image
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center ${
                        item.productType === 'DIGITAL' ? 'bg-violet-500' : 'bg-accent'
                      }`}>
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        {item.productType === 'DIGITAL' && (
                          <span className="text-xs px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded">
                            Digital
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        ${item.price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {!digitalOnly && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Shipping</span>
                    {selectedRate ? (
                      <span className={selectedRate.isFreeShipping ? 'text-green-500' : ''}>
                        {selectedRate.isFreeShipping ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                      </span>
                    ) : (
                      <span className="text-text-secondary">Select method</span>
                    )}
                  </div>
                )}
                {digitalOnly && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Delivery</span>
                    <span className="text-violet-400">Instant Download</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    Tax
                    {taxInfo && taxInfo.totalTaxRate > 0 && (
                      <span className="text-xs ml-1">
                        ({(taxInfo.totalTaxRate * 100).toFixed(2)}%)
                      </span>
                    )}
                  </span>
                  {loadingTax ? (
                    <span className="text-text-secondary">Calculating...</span>
                  ) : taxInfo ? (
                    <span>${taxAmount.toFixed(2)}</span>
                  ) : (
                    <span className="text-text-secondary">--</span>
                  )}
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/cart"
                className="block text-center text-sm text-text-secondary hover:text-text-primary mt-4"
              >
                ← Edit Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

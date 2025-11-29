'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  image?: string
  sku?: string
  product: {
    id: string
    name: string
    slug: string
    images: any
  }
}

interface Address {
  id: string
  fullName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
}

interface ShippingRate {
  id: string
  carrier: string
  service: string
  serviceName: string
  rate: number
  deliveryDays: number | null
}

interface ShippingLabel {
  id: string
  trackingNumber: string | null
  carrier: string
  service: string
  labelCost: number
  totalCost: number
  labelUrl: string | null
  status: string
  createdAt: string
  providerData?: {
    trackingUrl?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  stripePaymentId?: string
  trackingNumber?: string
  carrier?: string
  discountCode?: string
  customerNotes?: string
  adminNotes?: string
  items: OrderItem[]
  shippingAddress?: Address
  createdAt: string
  updatedAt: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Form state
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('requested_by_customer')
  const [refunding, setRefunding] = useState(false)

  // Shipping label state
  const [showShippingModal, setShowShippingModal] = useState(false)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRateId, setSelectedRateId] = useState('')
  const [shipmentId, setShipmentId] = useState('')
  const [loadingRates, setLoadingRates] = useState(false)
  const [purchasingLabel, setPurchasingLabel] = useState(false)
  const [existingLabel, setExistingLabel] = useState<ShippingLabel | null>(null)
  const [parcelInfo, setParcelInfo] = useState<any>(null)
  const [addressInfo, setAddressInfo] = useState<{ fromAddress?: any; toAddress?: any }>({})
  const [shippingError, setShippingError] = useState('')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchOrder()
    fetchExistingLabel()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        setStatus(data.status)
        setPaymentStatus(data.paymentStatus)
        setTrackingNumber(data.trackingNumber || '')
        setCarrier(data.carrier || '')
        setAdminNotes(data.adminNotes || '')
      } else {
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingLabel = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipping/label`)
      if (res.ok) {
        const data = await res.json()
        setExistingLabel(data.label)
      }
    } catch (error) {
      console.error('Error fetching existing label:', error)
    }
  }

  const fetchShippingRates = async () => {
    setLoadingRates(true)
    setShippingError('')
    setShippingRates([])
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()

      if (res.ok) {
        setShippingRates(data.rates || [])
        setShipmentId(data.shipmentId)
        setParcelInfo(data.parcel)
        setAddressInfo({ fromAddress: data.fromAddress, toAddress: data.toAddress })
        if (data.rates?.length > 0) {
          setSelectedRateId(data.rates[0].id)
        }
      } else {
        setShippingError(data.error || 'Failed to get shipping rates')
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error)
      setShippingError('Failed to connect to shipping provider')
    } finally {
      setLoadingRates(false)
    }
  }

  const handlePurchaseLabel = async () => {
    if (!selectedRateId || !shipmentId) return

    setPurchasingLabel(true)
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipping/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId,
          rateId: selectedRateId,
          fromAddress: addressInfo.fromAddress,
          toAddress: addressInfo.toAddress,
          parcel: parcelInfo,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setExistingLabel(data.label)
        setShowShippingModal(false)
        setTrackingNumber(data.trackingNumber || '')
        setCarrier(data.label?.carrier || '')
        fetchOrder()
        alert(`Label purchased! Tracking: ${data.trackingNumber}`)
        if (data.labelUrl) {
          window.open(data.labelUrl, '_blank')
        }
      } else {
        alert(data.error || 'Failed to purchase label')
      }
    } catch (error) {
      console.error('Error purchasing label:', error)
      alert('Failed to purchase label')
    } finally {
      setPurchasingLabel(false)
    }
  }

  const handleVoidLabel = async () => {
    if (!confirm('Are you sure you want to void this shipping label? This may not be refundable depending on the carrier.')) return

    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipping/label`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setExistingLabel(null)
        setTrackingNumber('')
        setCarrier('')
        fetchOrder()
        alert('Label voided successfully')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to void label')
      }
    } catch (error) {
      console.error('Error voiding label:', error)
      alert('Failed to void label')
    }
  }

  const openShippingModal = () => {
    setShowShippingModal(true)
    fetchShippingRates()
  }

  const handleRefund = async () => {
    if (!confirm(`Are you sure you want to refund $${refundAmount || Number(order?.total).toFixed(2)}?`)) {
      return
    }

    try {
      setRefunding(true)
      const res = await fetch(`/api/admin/orders/${params.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: refundAmount || null,
          reason: refundReason,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setOrder(data.order)
        setStatus(data.order.status)
        setPaymentStatus(data.order.paymentStatus)
        setAdminNotes(data.order.adminNotes || '')
        setShowRefundModal(false)
        setRefundAmount('')
        alert(`Refund of $${data.amount.toFixed(2)} processed successfully!`)
      } else {
        alert(data.error || 'Failed to process refund')
      }
    } catch (error) {
      console.error('Error processing refund:', error)
      alert('Failed to process refund')
    } finally {
      setRefunding(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus,
          trackingNumber: trackingNumber || null,
          carrier: carrier || null,
          adminNotes: adminNotes || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        alert('Order updated successfully!')
      } else {
        alert('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      PAID: '#10b981',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
      REFUNDED: '#6b7280',
    }
    return colors[s] || '#6b7280'
  }

  const getPaymentStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      SUCCEEDED: '#10b981',
      FAILED: '#ef4444',
      REFUNDED: '#6b7280',
    }
    return colors[s] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProductImage = (item: OrderItem) => {
    if (item.image) return item.image
    if (item.product?.images) {
      const images = typeof item.product.images === 'string'
        ? JSON.parse(item.product.images)
        : item.product.images
      if (Array.isArray(images) && images.length > 0) return images[0]
    }
    return null
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Loading order...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Order not found</p>
      </div>
    )
  }

  const orderStatuses = ['PENDING', 'PROCESSING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
  const paymentStatuses = ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED']
  const carriers = ['USPS', 'UPS', 'FedEx', 'DHL', 'Other']

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <Link
            href="/admin/orders"
            style={{
              color: '#71717a',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '8px',
            }}
          >
            ← Back to Orders
          </Link>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 700,
            margin: 0,
          }}>Order {order.orderNumber}</h1>
          <p style={{ color: '#71717a', margin: '8px 0 0 0' }}>
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            background: `${getStatusColor(order.status)}20`,
            color: getStatusColor(order.status),
          }}>
            {order.status}
          </span>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            background: `${getPaymentStatusColor(order.paymentStatus)}20`,
            color: getPaymentStatusColor(order.paymentStatus),
          }}>
            {order.paymentStatus}
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              target="_blank"
              style={{
                padding: '6px 12px',
                background: '#27272a',
                color: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Invoice
            </Link>
            <Link
              href={`/admin/orders/${order.id}/invoice?type=packing`}
              target="_blank"
              style={{
                padding: '6px 12px',
                background: '#27272a',
                color: 'white',
                borderRadius: '8px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Packing Slip
            </Link>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: '24px',
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Order Items */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Order Items ({order.items.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: '#09090b',
                    borderRadius: '12px',
                  }}
                >
                  {getProductImage(item) && (
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>
                      {item.name}
                    </h3>
                    {item.sku && (
                      <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 8px 0' }}>
                        SKU: {item.sku}
                      </p>
                    )}
                    <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>
                      ${Number(item.price).toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                      ${Number(item.total).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{
              borderTop: '1px solid #27272a',
              marginTop: '16px',
              paddingTop: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a1a1aa' }}>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#a1a1aa' }}>
                    Discount {order.discountCode && `(${order.discountCode})`}
                  </span>
                  <span style={{ color: '#10b981' }}>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a1a1aa' }}>Shipping</span>
                <span>${Number(order.shipping).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#a1a1aa' }}>Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #27272a',
                fontSize: '18px',
                fontWeight: 600,
              }}>
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', margin: '0 0 12px 0' }}>
                Customer Notes
              </h2>
              <p style={{ color: '#a1a1aa', margin: 0, whiteSpace: 'pre-wrap' }}>
                {order.customerNotes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Info */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Customer
            </h2>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontWeight: 500, margin: '0 0 4px 0' }}>{order.customerName}</p>
              <a href={`mailto:${order.customerEmail}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                {order.customerEmail}
              </a>
              {order.customerPhone && (
                <p style={{ color: '#a1a1aa', margin: '4px 0 0 0' }}>
                  {order.customerPhone}
                </p>
              )}
            </div>

            {order.shippingAddress && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#71717a', margin: '0 0 8px 0' }}>
                  Shipping Address
                </h3>
                <div style={{ color: '#a1a1aa', fontSize: '14px' }}>
                  <p style={{ margin: '0 0 2px 0' }}>{order.shippingAddress.fullName}</p>
                  {order.shippingAddress.company && (
                    <p style={{ margin: '0 0 2px 0' }}>{order.shippingAddress.company}</p>
                  )}
                  <p style={{ margin: '0 0 2px 0' }}>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && (
                    <p style={{ margin: '0 0 2px 0' }}>{order.shippingAddress.address2}</p>
                  )}
                  <p style={{ margin: 0 }}>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p style={{ margin: 0 }}>{order.shippingAddress.country}</p>
                </div>
              </>
            )}
          </div>

          {/* Update Order */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Update Order
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Order Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                {paymentStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Carrier
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option value="">Select carrier...</option>
                {carriers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes about this order..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Payment Info */}
          {order.stripePaymentId && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', margin: '0 0 12px 0' }}>
                Payment Info
              </h2>
              <p style={{ fontSize: '14px', color: '#71717a', margin: '0 0 4px 0' }}>Stripe Payment ID</p>
              <p style={{ fontSize: '14px', margin: '0 0 16px 0', wordBreak: 'break-all' }}>{order.stripePaymentId}</p>

              {order.paymentStatus === 'SUCCEEDED' && (
                <button
                  onClick={() => {
                    setRefundAmount(Number(order.total).toFixed(2))
                    setShowRefundModal(true)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#ef444420',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Process Refund
                </button>
              )}

              {order.paymentStatus === 'REFUNDED' && (
                <div style={{
                  padding: '10px',
                  background: '#6b728020',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                }}>
                  Order has been refunded
                </div>
              )}
            </div>
          )}

          {/* Shipping Label */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Shipping Label
            </h2>

            {existingLabel ? (
              <div>
                <div style={{
                  padding: '12px',
                  background: '#10b98120',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 500 }}>Label Purchased</span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      background: '#10b98140',
                      borderRadius: '4px',
                      color: '#10b981',
                    }}>
                      {existingLabel.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', margin: '0 0 4px 0' }}>
                    <strong>Carrier:</strong> {existingLabel.carrier} - {existingLabel.service}
                  </p>
                  {existingLabel.trackingNumber && (
                    <p style={{ fontSize: '14px', margin: '0 0 4px 0' }}>
                      <strong>Tracking:</strong> {existingLabel.trackingNumber}
                    </p>
                  )}
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    <strong>Cost:</strong> ${Number(existingLabel.totalCost).toFixed(2)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {existingLabel.labelUrl && (
                    <a
                      href={existingLabel.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Print Label
                    </a>
                  )}
                  {existingLabel.providerData?.trackingUrl && (
                    <a
                      href={existingLabel.providerData.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#27272a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        textAlign: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      Track Package
                    </a>
                  )}
                </div>

                {existingLabel.status === 'PURCHASED' && (
                  <button
                    onClick={handleVoidLabel}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '10px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Void Label
                  </button>
                )}
              </div>
            ) : order.shippingAddress ? (
              <div>
                <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px', margin: '0 0 16px 0' }}>
                  No shipping label purchased yet. Get real-time rates from USPS, UPS, and FedEx.
                </p>
                <button
                  onClick={openShippingModal}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Buy Shipping Label
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#71717a', margin: 0 }}>
                No shipping address on this order.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', margin: '0 0 20px 0' }}>
              Process Refund
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Refund Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#71717a',
                }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(order.total)}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 24px',
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px', margin: '4px 0 0 0' }}>
                Order total: ${Number(order.total).toFixed(2)}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Reason
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option value="requested_by_customer">Customer Request</option>
                <option value="duplicate">Duplicate Payment</option>
                <option value="fraudulent">Fraudulent</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={refunding}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refunding || !refundAmount || parseFloat(refundAmount) <= 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: refunding ? 'not-allowed' : 'pointer',
                  opacity: refunding ? 0.7 : 1,
                }}
              >
                {refunding ? 'Processing...' : 'Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Modal */}
      {showShippingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                Buy Shipping Label
              </h2>
              <button
                onClick={() => setShowShippingModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            {/* Package Info */}
            {parcelInfo && (
              <div style={{
                padding: '12px',
                background: '#09090b',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0' }}>Package Dimensions</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {parcelInfo.length}" × {parcelInfo.width}" × {parcelInfo.height}" • {(parcelInfo.weight / 16).toFixed(2)} lbs
                </p>
              </div>
            )}

            {/* Error */}
            {shippingError && (
              <div style={{
                padding: '12px',
                background: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '14px',
              }}>
                {shippingError}
              </div>
            )}

            {/* Loading */}
            {loadingRates && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid #27272a',
                  borderTopColor: '#8b5cf6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                <p style={{ color: '#a1a1aa', margin: 0 }}>Getting shipping rates...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Rates */}
            {!loadingRates && shippingRates.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', margin: '0 0 12px 0' }}>
                  Select a shipping rate:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: selectedRateId === rate.id ? '#8b5cf620' : '#09090b',
                        border: `1px solid ${selectedRateId === rate.id ? '#8b5cf6' : '#27272a'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="shippingRate"
                        value={rate.id}
                        checked={selectedRateId === rate.id}
                        onChange={(e) => setSelectedRateId(e.target.value)}
                        style={{ marginRight: '12px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 500 }}>{rate.serviceName}</span>
                          <span style={{ fontWeight: 600, color: '#8b5cf6' }}>${rate.rate.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                          {rate.carrier}
                          {rate.deliveryDays && ` • ${rate.deliveryDays} day${rate.deliveryDays !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {!loadingRates && shippingRates.length > 0 && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowShippingModal(false)}
                  disabled={purchasingLabel}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#27272a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePurchaseLabel}
                  disabled={purchasingLabel || !selectedRateId}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: purchasingLabel ? 'not-allowed' : 'pointer',
                    opacity: purchasingLabel ? 0.7 : 1,
                  }}
                >
                  {purchasingLabel ? 'Purchasing...' : `Purchase Label ($${shippingRates.find(r => r.id === selectedRateId)?.rate.toFixed(2) || '0.00'})`}
                </button>
              </div>
            )}

            {/* No rates */}
            {!loadingRates && !shippingError && shippingRates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#71717a' }}>
                <p style={{ margin: 0 }}>No shipping rates available. Please check your EasyPost configuration and business address.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

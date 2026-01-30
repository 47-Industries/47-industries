'use client'

import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPrint,
  faSpinner,
  faSync,
  faEye,
  faPaperPlane,
  faCheck,
  faTruck,
  faExclamationTriangle,
  faBoxOpen,
  faCreditCard,
  faDownload,
} from '@fortawesome/free-solid-svg-icons'

interface PrintOrder {
  id: string
  orderNumber: string
  status: string
  productType: string
  productVariant: string
  quantity: number
  retailAmount: number
  costAmount: number
  shippingAmount: number
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingState: string
  shippingZip: string
  designData: {
    name: string
    tagline?: string
    shopName?: string
    address?: string
    city?: string
    state?: string
    profileImage?: string
    heroImage?: string
    themeColor?: string
    logoOption?: string
    customLogo?: string
    slug: string
  }
  printerOrderId?: string
  trackingNumber?: string
  trackingUrl?: string
  createdAt: string
  paidAt?: string
  submittedAt?: string
  shippedAt?: string
  barber: {
    name: string
    email: string
    slug: string
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', color: '#f59e0b', icon: faCreditCard },
  PAID: { label: 'Ready to Print', color: '#3b82f6', icon: faCheck },
  GENERATING_ASSETS: { label: 'Generating Files', color: '#8b5cf6', icon: faSpinner },
  READY_TO_SUBMIT: { label: 'Ready to Submit', color: '#10b981', icon: faPaperPlane },
  SUBMITTED: { label: 'Submitted to Printer', color: '#06b6d4', icon: faPrint },
  IN_PRODUCTION: { label: 'In Production', color: '#f97316', icon: faBoxOpen },
  SHIPPED: { label: 'Shipped', color: '#22c55e', icon: faTruck },
  DELIVERED: { label: 'Delivered', color: '#10b981', icon: faCheck },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', icon: faExclamationTriangle },
  REFUNDED: { label: 'Refunded', color: '#71717a', icon: faExclamationTriangle },
}

export default function PrintQueuePage() {
  const [isMobile, setIsMobile] = useState(false)
  const [orders, setOrders] = useState<PrintOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<PrintOrder | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'shipped'>('pending')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/print-queue')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
    setLoading(false)
  }

  const submitToPrinter = async (orderId: string) => {
    if (!confirm('Submit this order to 4over for printing?')) return

    setSubmitting(orderId)
    try {
      const res = await fetch(`/api/admin/print-queue/${orderId}/submit`, {
        method: 'POST',
      })
      if (res.ok) {
        alert('Order submitted to printer!')
        fetchOrders()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to submit order')
      }
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Failed to submit order')
    }
    setSubmitting(null)
  }

  const markAsShipped = async (orderId: string, trackingNumber: string) => {
    try {
      const res = await fetch(`/api/admin/print-queue/${orderId}/ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber }),
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const downloadDesignFiles = async (order: PrintOrder) => {
    // Generate and download the business card HTML files
    try {
      const res = await fetch('/api/admin/business-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order.designData),
      })
      if (res.ok) {
        const data = await res.json()

        // Download front
        const frontBlob = new Blob([data.front], { type: 'text/html' })
        const frontUrl = URL.createObjectURL(frontBlob)
        const frontLink = document.createElement('a')
        frontLink.href = frontUrl
        frontLink.download = `${order.orderNumber}-front.html`
        frontLink.click()

        // Download back
        const backBlob = new Blob([data.back], { type: 'text/html' })
        const backUrl = URL.createObjectURL(backBlob)
        const backLink = document.createElement('a')
        backLink.href = backUrl
        backLink.download = `${order.orderNumber}-back.html`
        backLink.click()

        URL.revokeObjectURL(frontUrl)
        URL.revokeObjectURL(backUrl)
      }
    } catch (error) {
      console.error('Error downloading files:', error)
      alert('Failed to download design files')
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    if (filter === 'pending') return ['PAID', 'READY_TO_SUBMIT'].includes(order.status)
    if (filter === 'submitted') return ['SUBMITTED', 'IN_PRODUCTION'].includes(order.status)
    if (filter === 'shipped') return ['SHIPPED', 'DELIVERED'].includes(order.status)
    return true
  })

  const pendingCount = orders.filter((o) => ['PAID', 'READY_TO_SUBMIT'].includes(o.status)).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 700, margin: 0 }}>
            <FontAwesomeIcon icon={faPrint} style={{ marginRight: '12px', color: '#3b82f6' }} />
            Print Queue
          </h1>
          <p style={{ color: '#a1a1aa', margin: '8px 0 0', fontSize: isMobile ? '14px' : '16px' }}>
            Manage business card orders from BookFade
          </p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#27272a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FontAwesomeIcon icon={faSync} spin={loading} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 4px' }}>Pending</p>
          <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#3b82f6' }}>{pendingCount}</p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 4px' }}>In Production</p>
          <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#f97316' }}>
            {orders.filter((o) => ['SUBMITTED', 'IN_PRODUCTION'].includes(o.status)).length}
          </p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 4px' }}>Shipped</p>
          <p style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#22c55e' }}>
            {orders.filter((o) => ['SHIPPED', 'DELIVERED'].includes(o.status)).length}
          </p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '0 0 4px' }}>Total Orders</p>
          <p style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>{orders.length}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: `Ready to Print (${pendingCount})` },
          { key: 'submitted', label: 'In Production' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'all', label: 'All Orders' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            style={{
              padding: '10px 20px',
              background: filter === tab.key ? '#3b82f6' : '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#71717a' }}>
            <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '32px', marginBottom: '16px' }} />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#71717a' }}>
            <FontAwesomeIcon icon={faBoxOpen} style={{ fontSize: '48px', marginBottom: '16px' }} />
            <p>No orders found</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #27272a' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>Order</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>Customer</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>Details</th>
                <th style={{ padding: '16px', textAlign: 'left', color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', color: '#a1a1aa', fontSize: '13px', fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PAID
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #27272a' }}>
                    <td style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{order.orderNumber}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#71717a' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>{order.designData.name}</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#71717a' }}>{order.barber?.email}</p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>{order.quantity} cards</p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#71717a' }}>
                        {order.productVariant === '14pt_gloss' ? 'Gloss UV' : order.productVariant === '14pt_matte' ? 'Matte' : 'Silk'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#10b981', fontWeight: 500 }}>
                        ${Number(order.retailAmount).toFixed(2)}
                      </p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: `${status.color}20`,
                        color: status.color,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 500,
                      }}>
                        <FontAwesomeIcon icon={status.icon} spin={status.icon === faSpinner} />
                        {status.label}
                      </span>
                      {order.trackingNumber && (
                        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#71717a' }}>
                          Tracking: {order.trackingNumber}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            padding: '8px 12px',
                            background: '#27272a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => downloadDesignFiles(order)}
                          style={{
                            padding: '8px 12px',
                            background: '#27272a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                          title="Download design files"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        {['PAID', 'READY_TO_SUBMIT'].includes(order.status) && (
                          <button
                            onClick={() => submitToPrinter(order.id)}
                            disabled={submitting === order.id}
                            style={{
                              padding: '8px 16px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              cursor: submitting === order.id ? 'not-allowed' : 'pointer',
                              opacity: submitting === order.id ? 0.7 : 1,
                            }}
                          >
                            {submitting === order.id ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: '6px' }} />
                                Submit
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              background: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 600 }}>
              Order {selectedOrder.orderNumber}
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 8px' }}>Customer</h3>
                <p style={{ margin: 0 }}>{selectedOrder.designData.name}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#71717a' }}>{selectedOrder.barber?.email}</p>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 8px' }}>Card Details</h3>
                <p style={{ margin: 0 }}>{selectedOrder.quantity} x {selectedOrder.productVariant === '14pt_gloss' ? 'Gloss UV' : selectedOrder.productVariant === '14pt_matte' ? 'Matte' : 'Silk Laminated'}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                  Tagline: {selectedOrder.designData.tagline || 'N/A'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                  Shop: {selectedOrder.designData.shopName || 'N/A'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '14px' }}>
                  Theme: <span style={{ color: selectedOrder.designData.themeColor }}>{selectedOrder.designData.themeColor}</span>
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 8px' }}>Shipping Address</h3>
                <p style={{ margin: 0 }}>{selectedOrder.shippingName}</p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#71717a' }}>
                  {selectedOrder.shippingAddress}<br />
                  {selectedOrder.shippingCity}, {selectedOrder.shippingState} {selectedOrder.shippingZip}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 8px' }}>Pricing</h3>
                <p style={{ margin: 0 }}>
                  Customer paid: <strong style={{ color: '#10b981' }}>${Number(selectedOrder.retailAmount).toFixed(2)}</strong>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#71717a' }}>
                  Our cost: ${Number(selectedOrder.costAmount).toFixed(2)} + ${Number(selectedOrder.shippingAmount).toFixed(2)} shipping
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#22c55e' }}>
                  Profit: ${(Number(selectedOrder.retailAmount) - Number(selectedOrder.costAmount) - Number(selectedOrder.shippingAmount)).toFixed(2)}
                </p>
              </div>

              {selectedOrder.designData.profileImage && (
                <div>
                  <h3 style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 8px' }}>Profile Image</h3>
                  <img
                    src={selectedOrder.designData.profileImage}
                    alt="Profile"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => downloadDesignFiles(selectedOrder)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ marginRight: '8px' }} />
                Download Design Files
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '12px 24px',
                  background: '#27272a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

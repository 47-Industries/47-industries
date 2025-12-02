'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// ============ TYPES ============
interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  image?: string
  product: {
    id: string
    name: string
    images: string[]
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
  trackingNumber?: string
  carrier?: string
  customerNotes?: string
  adminNotes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

interface ReturnRequest {
  id: string
  orderId: string
  order: {
    id: string
    user: { name: string | null; email: string } | null
  }
  items: Array<{
    productId: string
    productName: string
    quantity: number
    reason: string
  }>
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED' | 'COMPLETED'
  refundAmount: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// ============ ORDERS TAB ============
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      PAID: '#10b981',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
      REFUNDED: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      SUCCEEDED: '#10b981',
      FAILED: '#ef4444',
      REFUNDED: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'PAID', label: 'Paid' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'REFUNDED', label: 'Refunded' },
  ]

  return (
    <div>
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by order #, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '150px',
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>No orders yet</h3>
          <p style={{ color: '#71717a', margin: 0 }}>
            Orders will appear here when customers make purchases
          </p>
        </div>
      ) : (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          overflow: 'hidden',
        }}>
          {/* Table Header - Desktop */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr auto',
              gap: '16px',
              padding: '16px 24px',
              borderBottom: '1px solid #27272a',
              background: '#09090b',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Order</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Customer</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Status</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Date</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Actions</div>
            </div>
          )}

          {/* Orders */}
          {orders.map((order, index) => (
            <div
              key={order.id}
              style={{
                display: isMobile ? 'block' : 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr 1fr 1fr 1fr auto',
                gap: '16px',
                padding: isMobile ? '16px' : '16px 24px',
                borderBottom: index < orders.length - 1 ? '1px solid #27272a' : 'none',
                alignItems: 'center',
              }}
            >
              {/* Order Number */}
              <div>
                <span style={{ fontWeight: 600 }}>{order.orderNumber}</span>
                {isMobile && (
                  <span style={{ color: '#71717a', fontSize: '14px', marginLeft: '8px' }}>
                    {formatDate(order.createdAt)}
                  </span>
                )}
              </div>

              {/* Customer */}
              <div>
                <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                <div style={{ fontSize: '14px', color: '#71717a' }}>{order.customerEmail}</div>
              </div>

              {/* Total */}
              <div style={{ fontWeight: 600 }}>
                ${Number(order.total).toFixed(2)}
                {isMobile && (
                  <span style={{ fontSize: '14px', color: '#71717a', fontWeight: 400 }}>
                    {' '}({order.items.length} items)
                  </span>
                )}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: `${getStatusColor(order.status)}20`,
                  color: getStatusColor(order.status),
                }}>
                  {order.status}
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: `${getPaymentStatusColor(order.paymentStatus)}20`,
                  color: getPaymentStatusColor(order.paymentStatus),
                }}>
                  {order.paymentStatus}
                </span>
              </div>

              {/* Date - Desktop only */}
              {!isMobile && (
                <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
                  {formatDate(order.createdAt)}
                </div>
              )}

              {/* Actions */}
              <div style={{ marginTop: isMobile ? '12px' : 0 }}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ RETURNS TAB ============
const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' },
  APPROVED: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' },
  RECEIVED: { bg: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' },
  REFUNDED: { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' },
  COMPLETED: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280' },
}

const reasonLabels: Record<string, string> = {
  DEFECTIVE: 'Defective Product',
  WRONG_ITEM: 'Wrong Item Received',
  NOT_AS_DESCRIBED: 'Not as Described',
  CHANGED_MIND: 'Changed Mind',
  DAMAGED: 'Damaged in Shipping',
  OTHER: 'Other',
}

function ReturnsTab() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null)

  useEffect(() => {
    fetchReturns()
  }, [statusFilter])

  const fetchReturns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/admin/returns?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns || [])
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error)
    }
    setLoading(false)
  }

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'PENDING').length,
    approved: returns.filter(r => r.status === 'APPROVED').length,
    completed: returns.filter(r => r.status === 'COMPLETED' || r.status === 'REFUNDED').length,
    totalRefunds: returns
      .filter(r => r.status === 'REFUNDED' || r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0),
  }

  return (
    <div>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Total Returns</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.total}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Pending Review</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#f59e0b' }}>{stats.pending}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Approved</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#3b82f6' }}>{stats.approved}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Completed</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#10b981' }}>{stats.completed}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Total Refunds</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#ef4444' }}>
            ${stats.totalRefunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        {[
          { value: 'all', label: 'All Returns' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'RECEIVED', label: 'Received' },
          { value: 'REFUNDED', label: 'Refunded' },
          { value: 'COMPLETED', label: 'Completed' },
          { value: 'REJECTED', label: 'Rejected' },
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: statusFilter === filter.value ? '#3b82f6' : '#1a1a1a',
              color: statusFilter === filter.value ? '#fff' : '#a1a1aa',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Returns List */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#71717a' }}>
          Loading returns...
        </div>
      ) : returns.length === 0 ? (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No return requests</h3>
          <p style={{ color: '#a1a1aa' }}>
            Return requests will appear here when customers submit them
          </p>
        </div>
      ) : (
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#27272a' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>RMA #</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Customer</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Order</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Reason</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Date</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(returnRequest => (
                <tr key={returnRequest.id} style={{ borderTop: '1px solid #27272a' }}>
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '14px' }}>
                    RMA-{returnRequest.id.slice(-8).toUpperCase()}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div>
                      <p style={{ fontWeight: '500', margin: 0 }}>{returnRequest.order?.user?.name || 'Guest'}</p>
                      <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '2px 0 0 0' }}>{returnRequest.order?.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <Link
                      href={`/admin/orders/${returnRequest.orderId}`}
                      style={{ color: '#3b82f6', textDecoration: 'none' }}
                    >
                      #{returnRequest.orderId.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#a1a1aa' }}>
                    {reasonLabels[returnRequest.reason] || returnRequest.reason}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: statusColors[returnRequest.status]?.bg || 'rgba(107, 114, 128, 0.2)',
                      color: statusColors[returnRequest.status]?.color || '#6b7280',
                    }}>
                      {returnRequest.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#a1a1aa' }}>
                    {new Date(returnRequest.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      onClick={() => setSelectedReturn(returnRequest)}
                      style={{
                        padding: '6px 12px',
                        background: '#27272a',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnRequest={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onUpdated={() => {
            setSelectedReturn(null)
            fetchReturns()
          }}
        />
      )}
    </div>
  )
}

// ============ RETURN DETAIL MODAL ============
function ReturnDetailModal({
  returnRequest,
  onClose,
  onUpdated,
}: {
  returnRequest: ReturnRequest
  onClose: () => void
  onUpdated: () => void
}) {
  const [status, setStatus] = useState(returnRequest.status)
  const [refundAmount, setRefundAmount] = useState(returnRequest.refundAmount?.toString() || '')
  const [notes, setNotes] = useState(returnRequest.notes || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdate = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/returns/${returnRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          refundAmount: refundAmount ? parseFloat(refundAmount) : null,
          notes,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update return')
      }

      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions: { value: string; label: string; description: string }[] = [
    { value: 'PENDING', label: 'Pending', description: 'Awaiting review' },
    { value: 'APPROVED', label: 'Approved', description: 'Return approved, awaiting item' },
    { value: 'REJECTED', label: 'Rejected', description: 'Return request denied' },
    { value: 'RECEIVED', label: 'Received', description: 'Item received, processing refund' },
    { value: 'REFUNDED', label: 'Refunded', description: 'Refund issued to customer' },
    { value: 'COMPLETED', label: 'Completed', description: 'Return fully processed' },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '640px',
        width: '100%',
        margin: '32px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Return Request</h2>
            <p style={{ color: '#a1a1aa', fontFamily: 'monospace', margin: '4px 0 0 0' }}>
              RMA-{returnRequest.id.slice(-8).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '24px', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#ef4444',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '14px',
          }}>
            {error}
          </div>
        )}

        {/* Customer & Order Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#27272a', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Customer</p>
            <p style={{ fontWeight: '500', margin: 0 }}>{returnRequest.order?.user?.name || 'Guest'}</p>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '2px 0 0 0' }}>{returnRequest.order?.user?.email || '-'}</p>
          </div>
          <div style={{ background: '#27272a', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Original Order</p>
            <Link
              href={`/admin/orders/${returnRequest.orderId}`}
              style={{ fontWeight: '500', color: '#3b82f6', textDecoration: 'none' }}
            >
              #{returnRequest.orderId.slice(-8).toUpperCase()}
            </Link>
            <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '2px 0 0 0' }}>
              {new Date(returnRequest.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Return Reason */}
        <div style={{ background: '#27272a', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Return Reason</p>
          <p style={{ fontWeight: '500', margin: 0 }}>{reasonLabels[returnRequest.reason] || returnRequest.reason}</p>
        </div>

        {/* Items Being Returned */}
        {returnRequest.items && returnRequest.items.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Items Being Returned</p>
            <div style={{ background: '#27272a', borderRadius: '8px', overflow: 'hidden' }}>
              {returnRequest.items.map((item, i) => (
                <div key={i} style={{ padding: '12px 16px', borderTop: i > 0 ? '1px solid #3f3f46' : 'none', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: '500', margin: 0 }}>{item.productName}</p>
                    <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '2px 0 0 0' }}>{item.reason}</p>
                  </div>
                  <span style={{ color: '#a1a1aa' }}>Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Update Status</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value as any)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  background: status === option.value ? '#3b82f6' : '#27272a',
                  color: status === option.value ? '#fff' : '#fff',
                }}
              >
                <p style={{ fontWeight: '500', fontSize: '13px', margin: 0 }}>{option.label}</p>
                <p style={{ fontSize: '11px', margin: '2px 0 0 0', color: status === option.value ? 'rgba(255,255,255,0.7)' : '#a1a1aa' }}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Refund Amount */}
        {(status === 'APPROVED' || status === 'RECEIVED' || status === 'REFUNDED' || status === 'COMPLETED') && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Refund Amount</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }}>$</span>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 28px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this return..."
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              resize: 'none',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleUpdate}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#27272a',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function OrdersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab = (tabParam === 'returns' ? 'returns' : 'orders') as 'orders' | 'returns'

  const tabs = [
    { id: 'orders' as const, label: 'Orders' },
    { id: 'returns' as const, label: 'Returns & RMA' },
  ]

  const handleTabChange = (tabId: 'orders' | 'returns') => {
    router.push(`/admin/orders?tab=${tabId}`)
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', margin: 0 }}>
          Orders
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
          Manage orders and return requests
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#1a1a1a',
        padding: '4px',
        borderRadius: '12px',
        marginBottom: '24px',
        width: 'fit-content',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#a1a1aa',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'returns' && <ReturnsTab />}
    </div>
  )
}

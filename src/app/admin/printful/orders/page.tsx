'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PrintfulOrderItem {
  id: string
  name: string
  quantity: number
  price: number
  image: string | null
}

interface PrintfulOrder {
  id: string
  orderId: string
  printfulOrderId: string | null
  status: string
  trackingNumber: string | null
  trackingUrl: string | null
  carrier: string | null
  shipDate: string | null
  printfulCost: number | null
  errorMessage: string | null
  retryCount: number
  createdAt: string
  updatedAt: string
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string
    total: number
    status: string
    createdAt: string
    items: PrintfulOrderItem[]
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SHIPPED: 'bg-green-500/10 text-green-400 border-green-500/20',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function PrintfulOrdersPage() {
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || ''

  const [orders, setOrders] = useState<PrintfulOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (statusFilter) {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/admin/printful/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (orderId: string) => {
    setRetrying(orderId)
    try {
      const res = await fetch(`/api/admin/printful/orders/${orderId}/retry`, {
        method: 'POST',
      })

      if (res.ok) {
        // Refresh orders
        fetchOrders(pagination.page)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to retry order')
      }
    } catch (error) {
      console.error('Error retrying order:', error)
      alert('Failed to retry order')
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/printful"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold">Printful Orders</h1>
          </div>
          <p className="text-text-secondary">Manage orders fulfilled by Printful</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Link
          href="/admin/printful/orders"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !statusFilter
              ? 'bg-accent text-white'
              : 'bg-surface border border-border hover:bg-surface-elevated'
          }`}
        >
          All
        </Link>
        {['PENDING', 'SUBMITTED', 'PROCESSING', 'SHIPPED', 'FAILED'].map((status) => (
          <Link
            key={status}
            href={`/admin/printful/orders?status=${status}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-accent text-white'
                : 'bg-surface border border-border hover:bg-surface-elevated'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No Printful orders</h3>
          <p className="text-text-secondary">
            {statusFilter
              ? `No ${statusFilter.toLowerCase()} orders found`
              : 'Orders with Printful items will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-elevated">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((pOrder) => (
                  <tr key={pOrder.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/orders/${pOrder.order.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {pOrder.order.orderNumber}
                      </Link>
                      <p className="text-xs text-text-secondary mt-1">
                        {new Date(pOrder.createdAt).toLocaleDateString()}
                      </p>
                      {pOrder.printfulOrderId && (
                        <p className="text-xs text-text-secondary">
                          Printful: #{pOrder.printfulOrderId}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{pOrder.order.customerName}</p>
                      <p className="text-sm text-text-secondary">{pOrder.order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {pOrder.order.items.slice(0, 2).map((item) => (
                          <p key={item.id} className="text-sm">
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                        {pOrder.order.items.length > 2 && (
                          <p className="text-xs text-text-secondary">
                            +{pOrder.order.items.length - 2} more
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[pOrder.status] || STATUS_COLORS.PENDING}`}>
                        {pOrder.status}
                      </span>
                      {pOrder.errorMessage && (
                        <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate" title={pOrder.errorMessage}>
                          {pOrder.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pOrder.trackingNumber ? (
                        <div>
                          <p className="text-sm font-medium">{pOrder.carrier}</p>
                          {pOrder.trackingUrl ? (
                            <a
                              href={pOrder.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-accent hover:underline"
                            >
                              {pOrder.trackingNumber}
                            </a>
                          ) : (
                            <p className="text-xs text-text-secondary">{pOrder.trackingNumber}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-text-secondary">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${pOrder.order.id}`}
                          className="px-3 py-1.5 text-xs bg-surface border border-border rounded hover:bg-surface-elevated transition-colors"
                        >
                          View Order
                        </Link>
                        {pOrder.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(pOrder.id)}
                            disabled={retrying === pOrder.id}
                            className="px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50 transition-colors"
                          >
                            {retrying === pOrder.id ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-text-secondary">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} orders
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrders(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 text-sm bg-surface border border-border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchOrders(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm bg-surface border border-border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

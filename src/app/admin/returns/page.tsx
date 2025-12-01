'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  APPROVED: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  REJECTED: { bg: 'bg-red-500/20', text: 'text-red-400' },
  RECEIVED: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  REFUNDED: { bg: 'bg-green-500/20', text: 'text-green-400' },
  COMPLETED: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
}

const reasonLabels: Record<string, string> = {
  DEFECTIVE: 'Defective Product',
  WRONG_ITEM: 'Wrong Item Received',
  NOT_AS_DESCRIBED: 'Not as Described',
  CHANGED_MIND: 'Changed Mind',
  DAMAGED: 'Damaged in Shipping',
  OTHER: 'Other',
}

export default function ReturnsPage() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Returns & RMA</h1>
          <p className="text-text-secondary mt-1">
            Manage return requests and refunds
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Returns</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Pending Review</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Approved</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{stats.approved}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Completed</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.completed}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Refunds</p>
          <p className="text-2xl font-bold mt-1 text-red-400">
            ${stats.totalRefunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-500 text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">No return requests</h3>
          <p className="text-text-secondary">
            Return requests will appear here when customers submit them
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">RMA #</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Order</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Date</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(returnRequest => (
                <tr key={returnRequest.id} className="border-b border-border last:border-0 hover:bg-surface-elevated/50">
                  <td className="px-6 py-4 font-mono text-sm">
                    RMA-{returnRequest.id.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{returnRequest.order?.user?.name || 'Guest'}</p>
                      <p className="text-sm text-text-secondary">{returnRequest.order?.user?.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orders/${returnRequest.orderId}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      #{returnRequest.orderId.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-secondary">
                      {reasonLabels[returnRequest.reason] || returnRequest.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[returnRequest.status]?.bg || 'bg-gray-500/20'
                    } ${statusColors[returnRequest.status]?.text || 'text-gray-400'}`}>
                      {returnRequest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {new Date(returnRequest.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedReturn(returnRequest)}
                      className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm hover:border-blue-500/50 transition-colors"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Return Request</h2>
            <p className="text-text-secondary font-mono">RMA-{returnRequest.id.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Customer & Order Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-surface-elevated rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-1">Customer</p>
            <p className="font-medium">{returnRequest.order?.user?.name || 'Guest'}</p>
            <p className="text-sm text-text-secondary">{returnRequest.order?.user?.email || '-'}</p>
          </div>
          <div className="bg-surface-elevated rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-1">Original Order</p>
            <Link
              href={`/admin/orders/${returnRequest.orderId}`}
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              #{returnRequest.orderId.slice(-8).toUpperCase()}
            </Link>
            <p className="text-sm text-text-secondary">
              {new Date(returnRequest.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Return Reason */}
        <div className="bg-surface-elevated rounded-lg p-4 mb-6">
          <p className="text-text-secondary text-sm mb-1">Return Reason</p>
          <p className="font-medium">{reasonLabels[returnRequest.reason] || returnRequest.reason}</p>
        </div>

        {/* Items Being Returned */}
        {returnRequest.items && returnRequest.items.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Items Being Returned</p>
            <div className="bg-surface-elevated rounded-lg divide-y divide-border">
              {returnRequest.items.map((item, i) => (
                <div key={i} className="p-3 flex justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-text-secondary">{item.reason}</p>
                  </div>
                  <span className="text-text-secondary">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Update */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Update Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatus(option.value as any)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  status === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-surface-elevated border border-border hover:border-blue-500/50'
                }`}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className={`text-xs ${status === option.value ? 'text-blue-100' : 'text-text-secondary'}`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Refund Amount */}
        {(status === 'APPROVED' || status === 'RECEIVED' || status === 'REFUNDED' || status === 'COMPLETED') && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Refund Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pl-8 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Admin Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes about this return..."
            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: string
  _count: {
    orders: number
  }
  totalSpent?: number
  lastOrderDate?: string
}

interface CustomerSegment {
  id: string
  name: string
  description: string | null
  color: string
  memberCount: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false)

  useEffect(() => {
    fetchCustomers()
    fetchSegments()
  }, [page, search, selectedSegment])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(selectedSegment && { segment: selectedSegment }),
      })

      const res = await fetch(`/api/admin/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
    setLoading(false)
  }

  const fetchSegments = async () => {
    try {
      const res = await fetch('/api/admin/customers/segments')
      if (res.ok) {
        const data = await res.json()
        setSegments(data.segments || [])
      }
    } catch (error) {
      console.error('Failed to fetch segments:', error)
    }
  }

  const stats = {
    totalCustomers: customers.length,
    newThisMonth: customers.filter(c => {
      const created = new Date(c.createdAt)
      const now = new Date()
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length,
    withOrders: customers.filter(c => c._count.orders > 0).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-text-secondary mt-1">
            Manage your customer relationships and segments
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewSegmentModal(true)}
            className="px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-surface-elevated transition-colors font-medium"
          >
            + New Segment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Customers</p>
          <p className="text-2xl font-bold mt-1">{stats.totalCustomers}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">New This Month</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.newThisMonth}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">With Orders</p>
          <p className="text-2xl font-bold mt-1 text-blue-400">{stats.withOrders}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Segments</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{segments.length}</p>
        </div>
      </div>

      {/* Segments */}
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedSegment('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedSegment === ''
                ? 'bg-blue-500 text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-white'
            }`}
          >
            All Customers
          </button>
          {segments.map(segment => (
            <button
              key={segment.id}
              onClick={() => setSelectedSegment(segment.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedSegment === segment.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface border border-border text-text-secondary hover:text-white'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.name}
              <span className="text-xs opacity-60">({segment.memberCount})</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-surface border border-border rounded-xl focus:outline-none focus:border-blue-500"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-text-secondary">
            {search ? 'Try a different search term' : 'Customers will appear here once they create an account or place an order'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-elevated">
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Orders</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Total Spent</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Joined</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-surface-elevated/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{customer.name || 'Anonymous'}</p>
                        <p className="text-sm text-text-secondary">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${customer._count.orders > 0 ? 'text-blue-400' : 'text-text-secondary'}`}>
                        {customer._count.orders}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        ${(customer.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm hover:border-blue-500/50 transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-surface border border-border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-surface border border-border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* New Segment Modal */}
      {showNewSegmentModal && (
        <NewSegmentModal
          onClose={() => setShowNewSegmentModal(false)}
          onCreated={() => {
            setShowNewSegmentModal(false)
            fetchSegments()
          }}
        />
      )}
    </div>
  )
}

function NewSegmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/customers/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create segment')
      }

      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">New Customer Segment</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Segment Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VIP Customers"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex gap-2">
              {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Segment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

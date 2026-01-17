'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string | null
  email: string | null
  emailVerified: string | null
  createdAt: string
  _count: { orders: number }
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

// ============ CUSTOMERS TAB ============
function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false)
  const [showEditSegmentModal, setShowEditSegmentModal] = useState<CustomerSegment | null>(null)

  // Password reset modal state
  const [resetPasswordUser, setResetPasswordUser] = useState<Customer | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
  const [sendNotification, setSendNotification] = useState(true)
  const [resetPasswordError, setResetPasswordError] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

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

  const deleteSegment = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return

    try {
      const res = await fetch(`/api/admin/customers/segments/${segmentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchSegments()
        if (selectedSegment === segmentId) {
          setSelectedSegment('')
        }
      }
    } catch (error) {
      console.error('Failed to delete segment:', error)
    }
  }

  const openResetPasswordModal = (customer: Customer) => {
    setResetPasswordUser(customer)
    setResetPassword('')
    setResetPasswordConfirm('')
    setSendNotification(true)
    setResetPasswordError('')
  }

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return

    if (resetPassword.length < 8) {
      setResetPasswordError('Password must be at least 8 characters')
      return
    }

    if (resetPassword !== resetPasswordConfirm) {
      setResetPasswordError('Passwords do not match')
      return
    }

    setResettingPassword(true)
    setResetPasswordError('')

    try {
      const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: resetPassword,
          sendNotification,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')

      setResetPasswordUser(null)
      alert('Password reset successfully' + (data.notificationSent ? ' - notification email sent' : ''))
    } catch (err: any) {
      setResetPasswordError(err.message)
    } finally {
      setResettingPassword(false)
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Total Customers</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.totalCustomers}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>New This Month</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#10b981' }}>{stats.newThisMonth}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>With Orders</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#3b82f6' }}>{stats.withOrders}</p>
        </div>
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Segments</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px', color: '#8b5cf6' }}>{segments.length}</p>
        </div>
      </div>

      {/* Segments Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            onClick={() => setSelectedSegment('')}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
              background: selectedSegment === '' ? '#3b82f6' : '#1a1a1a',
              color: '#fff',
            }}
          >
            All Customers
          </button>
          {segments.map(segment => (
            <div key={segment.id} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <button
                onClick={() => setSelectedSegment(segment.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px 0 0 8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedSegment === segment.id ? '#3b82f6' : '#1a1a1a',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: segment.color }} />
                {segment.name}
                <span style={{ fontSize: '12px', opacity: 0.6 }}>({segment.memberCount})</span>
              </button>
              <button
                onClick={() => setShowEditSegmentModal(segment)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '0',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedSegment === segment.id ? '#2563eb' : '#27272a',
                  color: '#a1a1aa',
                }}
              >
                ✎
              </button>
              <button
                onClick={() => deleteSegment(segment.id)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '0 8px 8px 0',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedSegment === segment.id ? '#1d4ed8' : '#27272a',
                  color: '#ef4444',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowNewSegmentModal(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            border: '1px solid #27272a',
            cursor: 'pointer',
            background: '#1a1a1a',
            color: '#fff',
          }}
        >
          + New Segment
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            background: '#1a1a1a',
            border: '1px solid #27272a',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '14px',
          }}
        />
        <svg
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#a1a1aa' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Customer List */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#a1a1aa' }}>
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <svg className="w-12 h-12 mx-auto mb-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No customers found</h3>
          <p style={{ color: '#a1a1aa' }}>
            {search ? 'Try a different search term' : 'Customers will appear here once they create an account or place an order'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ background: '#1a1a1a', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#27272a' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Customer</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Orders</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Total Spent</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Joined</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#a1a1aa' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id} style={{ borderTop: '1px solid #27272a' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          fontWeight: '600',
                        }}>
                          {(customer.name || customer.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: '500' }}>{customer.name || 'Anonymous'}</p>
                          <p style={{ fontSize: '13px', color: '#a1a1aa' }}>{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500', color: customer._count.orders > 0 ? '#3b82f6' : '#71717a' }}>
                        {customer._count.orders}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: '500' }}>
                        ${(customer.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: '#a1a1aa' }}>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        style={{
                          padding: '6px 12px',
                          background: '#27272a',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#fff',
                          textDecoration: 'none',
                          marginRight: '8px',
                        }}
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openResetPasswordModal(customer)}
                        style={{
                          padding: '6px 12px',
                          background: '#f59e0b20',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#f59e0b',
                          cursor: 'pointer',
                        }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: '8px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px', color: '#a1a1aa' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: '8px 16px',
                  background: '#1a1a1a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* New Segment Modal */}
      {showNewSegmentModal && (
        <SegmentModal
          onClose={() => setShowNewSegmentModal(false)}
          onSaved={() => {
            setShowNewSegmentModal(false)
            fetchSegments()
          }}
        />
      )}

      {/* Edit Segment Modal */}
      {showEditSegmentModal && (
        <SegmentModal
          segment={showEditSegmentModal}
          onClose={() => setShowEditSegmentModal(null)}
          onSaved={() => {
            setShowEditSegmentModal(null)
            fetchSegments()
          }}
        />
      )}

      {/* Password Reset Modal */}
      {resetPasswordUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px',
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
            width: '100%',
            maxWidth: '450px',
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Reset Password</h2>
              <button
                onClick={() => setResetPasswordUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                x
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ color: '#a1a1aa', marginBottom: '20px', fontSize: '14px' }}>
                Reset password for <strong style={{ color: '#fff' }}>{resetPasswordUser.name || resetPasswordUser.email}</strong>
              </p>

              {resetPasswordError && (
                <div style={{
                  background: '#7f1d1d',
                  border: '1px solid #991b1b',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  color: '#fca5a5',
                  fontSize: '14px'
                }}>
                  {resetPasswordError}
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#a1a1aa' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#a1a1aa' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#a1a1aa',
                }}>
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  Send email notification to user
                </label>
              </div>
            </div>

            <div style={{
              padding: '20px',
              borderTop: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setResetPasswordUser(null)}
                style={{
                  padding: '10px 20px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resettingPassword || !resetPassword || !resetPasswordConfirm}
                style={{
                  padding: '10px 20px',
                  background: resettingPassword ? '#52525b' : '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  cursor: resettingPassword ? 'not-allowed' : 'pointer',
                }}
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ============ SEGMENT MODAL ============
function SegmentModal({
  segment,
  onClose,
  onSaved
}: {
  segment?: CustomerSegment
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(segment?.name || '')
  const [description, setDescription] = useState(segment?.description || '')
  const [color, setColor] = useState(segment?.color || '#3b82f6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = segment
        ? `/api/admin/customers/segments/${segment.id}`
        : '/api/admin/customers/segments'

      const res = await fetch(url, {
        method: segment ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save segment')
      }

      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          {segment ? 'Edit Segment' : 'New Customer Segment'}
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Segment Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., VIP Customers"
              style={{
                width: '100%',
                padding: '12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : 'none',
                    cursor: 'pointer',
                    outline: color === c ? '2px solid #fff' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
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
              {loading ? 'Saving...' : segment ? 'Save Changes' : 'Create Segment'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: '#27272a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontWeight: '500',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============
export default function UsersPage() {
  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
          Customers
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
          Manage customer accounts and segments
        </p>
      </div>

      <CustomersTab />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

type Permission = 'products' | 'orders' | 'users' | 'settings' | 'email' | 'custom_requests' | 'analytics'

const AVAILABLE_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: 'products', label: 'Products', description: 'Manage products and categories' },
  { key: 'orders', label: 'Orders', description: 'View and manage orders' },
  { key: 'users', label: 'Users', description: 'Manage user accounts' },
  { key: 'settings', label: 'Settings', description: 'Access site settings' },
  { key: 'email', label: 'Email', description: 'Access company email' },
  { key: 'custom_requests', label: 'Custom Requests', description: 'Manage 3D printing requests' },
  { key: 'analytics', label: 'Analytics', description: 'View analytics dashboard' },
]

const COMPANY_EMAILS = [
  'support@47industries.com',
  'sales@47industries.com',
  'admin@47industries.com',
  'info@47industries.com',
]

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  image: string | null
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
  permissions: Permission[] | null
  emailAccess: string[] | null
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
  const [customers, setCustomers] = useState<User[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false)
  const [showEditSegmentModal, setShowEditSegmentModal] = useState<CustomerSegment | null>(null)

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
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>👥</div>
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
                        }}
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
    </div>
  )
}

// ============ ADMINS TAB ============
function AdminsTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'SUPER_ADMIN',
    permissions: [] as Permission[],
    emailAccess: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      // Fetch both ADMIN and SUPER_ADMIN roles
      params.set('adminRoles', 'true')
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'ADMIN',
      permissions: [],
      emailAccess: [],
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      password: '',
      role: user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      permissions: user.permissions || [],
      emailAccess: user.emailAccess || [],
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'

      const method = editingUser ? 'PATCH' : 'POST'

      const body: any = {
        name: formData.name,
        username: formData.username || null,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        emailAccess: formData.emailAccess,
      }

      if (formData.password) {
        body.password = formData.password
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save user')

      setShowModal(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name || user.email}? This cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const togglePermission = (perm: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  const toggleEmailAccess = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emailAccess: prev.emailAccess.includes(email)
        ? prev.emailAccess.filter(e => e !== email)
        : [...prev.emailAccess, email]
    }))
  }

  const adminCount = users.filter(u => u.role === 'ADMIN').length
  const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
            {adminCount} admins, {superAdminCount} super admins
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + Add Admin
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '8px',
            border: '1px solid #3f3f46',
            background: '#1a1a1a',
            color: '#fff',
            fontSize: '14px',
          }}
        />
      </div>

      {/* User List */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #27272a',
        overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            Loading admins...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            No admins found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#27272a' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Admin</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Permissions</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Email Access</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Joined</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderTop: '1px solid #27272a' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: user.role === 'SUPER_ADMIN' ? '#7c3aed' : '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#fff',
                      }}>
                        {(user.name || user.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{user.name || 'No name'}</div>
                        <div style={{ color: '#a1a1aa', fontSize: '12px' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: user.role === 'SUPER_ADMIN' ? '#7c3aed' : '#3b82f6',
                      color: '#fff',
                    }}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {user.permissions && user.permissions.length > 0 ? (
                      <span>{user.permissions.length} permissions</span>
                    ) : (
                      <span style={{ color: '#71717a' }}>None set</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {user.emailAccess && user.emailAccess.length > 0 ? (
                      <span>{user.emailAccess.length} mailboxes</span>
                    ) : (
                      <span style={{ color: '#71717a' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => openEditModal(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#27272a',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginRight: '8px',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      style={{
                        padding: '6px 12px',
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Admin Modal */}
      {showModal && (
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
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
                {editingUser ? 'Edit Admin' : 'Create Admin'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '24px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {error && (
                <div style={{
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  marginBottom: '16px',
                  fontSize: '14px',
                }}>
                  {error}
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Username */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Username (for login)
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                  placeholder="e.g., johndoe"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                  Lowercase letters and numbers only. User can log in with this or their email.
                </p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #3f3f46',
                    background: '#0a0a0a',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Role
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['ADMIN', 'SUPER_ADMIN'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role }))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: formData.role === role ? '2px solid #3b82f6' : '1px solid #3f3f46',
                        background: formData.role === role ? 'rgba(59, 130, 246, 0.1)' : '#0a0a0a',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#a1a1aa' }}>
                  Permissions
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() => togglePermission(perm.key)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: formData.permissions.includes(perm.key) ? '2px solid #10b981' : '1px solid #3f3f46',
                        background: formData.permissions.includes(perm.key) ? 'rgba(16, 185, 129, 0.1)' : '#0a0a0a',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '500' }}>{perm.label}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{perm.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Access */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#a1a1aa' }}>
                  Email Access
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COMPANY_EMAILS.map(email => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => toggleEmailAccess(email)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: formData.emailAccess.includes(email) ? '2px solid #3b82f6' : '1px solid #3f3f46',
                        background: formData.emailAccess.includes(email) ? 'rgba(59, 130, 246, 0.1)' : '#0a0a0a',
                        color: '#fff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: formData.emailAccess.includes(email) ? '2px solid #3b82f6' : '1px solid #3f3f46',
                        background: formData.emailAccess.includes(email) ? '#3b82f6' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {formData.emailAccess.includes(email) && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '13px' }}>{email}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create Admin'}
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab = (tabParam === 'admins' ? 'admins' : 'customers') as 'customers' | 'admins'

  const tabs = [
    { id: 'customers' as const, label: 'Customers' },
    { id: 'admins' as const, label: 'Admins' },
  ]

  const handleTabChange = (tabId: 'customers' | 'admins') => {
    router.push(`/admin/users?tab=${tabId}`)
  }

  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
          User Management
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
          Manage customers and admin accounts
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
      {activeTab === 'customers' && <CustomersTab />}
      {activeTab === 'admins' && <AdminsTab />}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

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
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'CUSTOMER' | 'ADMIN'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    permissions: [] as Permission[],
    emailAccess: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
  }, [filter, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('role', filter)
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
      email: '',
      password: '',
      role: 'CUSTOMER',
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
      email: user.email || '',
      password: '',
      role: user.role,
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
        email: formData.email,
        role: formData.role,
        permissions: formData.role !== 'CUSTOMER' ? formData.permissions : null,
        emailAccess: formData.role !== 'CUSTOMER' ? formData.emailAccess : null,
      }

      // Only include password if set
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

  const customerCount = users.filter(u => u.role === 'CUSTOMER').length
  const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length

  return (
    <div style={{ padding: '24px', color: '#fff', minHeight: '100vh', background: '#000' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            User Management
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
            {customerCount} customers, {adminCount} admins
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
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'CUSTOMER', 'ADMIN'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                background: filter === f ? '#3b82f6' : '#27272a',
                color: '#fff',
              }}
            >
              {f === 'all' ? 'All Users' : f === 'CUSTOMER' ? 'Customers' : 'Admins'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 16px',
            borderRadius: '6px',
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
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            No users found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#27272a' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Role</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Permissions</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Email Access</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#a1a1aa', fontWeight: '500', fontSize: '13px' }}>Orders</th>
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
                        background: '#3b82f6',
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
                      background: user.role === 'SUPER_ADMIN' ? '#7c3aed' : user.role === 'ADMIN' ? '#3b82f6' : '#27272a',
                      color: '#fff',
                    }}>
                      {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {user.role === 'CUSTOMER' ? (
                      <span style={{ color: '#71717a' }}>N/A</span>
                    ) : user.permissions && user.permissions.length > 0 ? (
                      <span>{user.permissions.length} permissions</span>
                    ) : (
                      <span style={{ color: '#71717a' }}>None set</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {user.role === 'CUSTOMER' ? (
                      <span style={{ color: '#71717a' }}>N/A</span>
                    ) : user.emailAccess && user.emailAccess.length > 0 ? (
                      <span>{user.emailAccess.length} mailboxes</span>
                    ) : (
                      <span style={{ color: '#71717a' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>
                    {user._count.orders}
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

      {/* Modal */}
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
                {editingUser ? 'Edit User' : 'Create User'}
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
                x
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

              {/* Basic Info */}
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
                  {(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'] as const).map(role => (
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
                      {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Customer'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Permissions */}
              {formData.role !== 'CUSTOMER' && (
                <>
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
                </>
              )}
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
                {saving ? 'Saving...' : editingUser ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

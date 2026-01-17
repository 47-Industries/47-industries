'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  name: string | null
  email: string | null
  username: string | null
  phone: string | null
  title: string | null
  image: string | null
  role: string
  permissions: string[] | null
  emailAccess: string[] | null
  backupEmail: string | null
  isFounder: boolean
  emailVerified: string | null
  createdAt: string
  zohoConnected: boolean
  lastSession: { expires: string } | null
  orders: Order[]
  _count: {
    orders: number
  }
  teamMember: { id: string; employeeNumber: string; title: string } | null
  client: { id: string; clientNumber: string; name: string } | null
  partner: { id: string; partnerNumber: string; name: string } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [promoteData, setPromoteData] = useState({
    title: '',
    department: '',
    grantAdminAccess: true,
  })

  // Edit state
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || '')
      setEditUsername(customer.username || '')
      setEditPhone(customer.phone || '')
      setEditTitle(customer.title || '')
    }
  }, [customer])

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/customers/${params.id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Customer not found')
        } else {
          throw new Error('Failed to fetch customer')
        }
        return
      }
      const data = await res.json()
      setCustomer(data.customer)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleSave = async () => {
    if (!customer) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName || null,
          username: editUsername || null,
          phone: editPhone || null,
          title: editTitle || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')

      fetchCustomer()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePromoteToTeam = async () => {
    if (!customer) return
    setPromoting(true)

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoteData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to promote customer')

      router.push(`/admin/team/${data.teamMemberId}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPromoting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-500/20 text-amber-400',
      PROCESSING: 'bg-blue-500/20 text-blue-400',
      SHIPPED: 'bg-purple-500/20 text-purple-400',
      DELIVERED: 'bg-green-500/20 text-green-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
      REFUNDED: 'bg-zinc-500/20 text-zinc-400',
    }
    return colors[status] || 'bg-zinc-500/20 text-zinc-400'
  }

  const hasChanges = customer && (
    editName !== (customer.name || '') ||
    editUsername !== (customer.username || '') ||
    editPhone !== (customer.phone || '') ||
    editTitle !== (customer.title || '')
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-800 rounded w-64"></div>
          <div className="h-64 bg-zinc-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-8">
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-12 text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Customer not found'}</p>
          <Link
            href="/admin/users"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  const totalSpent = customer.orders?.reduce((sum, order) => {
    if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      return sum + (order.total || 0)
    }
    return sum
  }, 0) || 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            {customer.image ? (
              <img
                src={customer.image}
                alt={customer.name || 'User'}
                className="w-16 h-16 rounded-xl object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-semibold">
                {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || customer.email?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {customer.name || 'Unnamed Customer'}
              </h1>
              <p className="text-zinc-400">{customer.email}</p>
              {customer.username && (
                <p className="text-zinc-500 text-sm font-mono">@{customer.username}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Linked accounts badges */}
          {customer.client && (
            <Link
              href={`/admin/clients/${customer.client.id}`}
              className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              Client: {customer.client.clientNumber}
            </Link>
          )}
          {customer.partner && (
            <Link
              href={`/admin/partners/${customer.partner.id}`}
              className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              Partner: {customer.partner.partnerNumber}
            </Link>
          )}
          {customer.teamMember && (
            <Link
              href={`/admin/team/${customer.teamMember.id}`}
              className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              Team: {customer.teamMember.employeeNumber}
            </Link>
          )}
          {!customer.teamMember && (
            <button
              onClick={() => setShowPromoteModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Promote to Team
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <div className="flex gap-6">
          {['overview', 'orders', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'orders' ? `Orders (${customer._count?.orders || 0})` : 'Account'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white mt-1">{customer._count?.orders || 0}</p>
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm">Customer Since</p>
              <p className="text-2xl font-bold text-white mt-1">{formatDate(customer.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-500">Name</label>
                  <p className="text-white">{customer.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Email</label>
                  <p className="text-white">{customer.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Phone</label>
                  <p className="text-white">{customer.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Title/Position</label>
                  <p className="text-white">{customer.title || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Username</label>
                  <p className="text-white font-mono">{customer.username ? `@${customer.username}` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-500">Email Verified</label>
                  <p>
                    {customer.emailVerified ? (
                      <span className="text-green-400">Yes - {formatDate(customer.emailVerified)}</span>
                    ) : (
                      <span className="text-amber-400">Not verified</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Account Role</label>
                  <p>
                    <span className="inline-block px-2 py-1 rounded text-sm bg-zinc-500/20 text-zinc-400">
                      Customer
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-zinc-500">Created</label>
                  <p className="text-white">{formatDate(customer.createdAt)}</p>
                </div>
                {customer.lastSession && (
                  <div>
                    <label className="text-sm text-zinc-500">Session Expires</label>
                    <p className="text-white">{formatDate(customer.lastSession.expires)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Linked Accounts */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Linked Accounts</h2>
              <div className="space-y-3">
                {customer.client ? (
                  <Link
                    href={`/admin/clients/${customer.client.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{customer.client.name}</p>
                      <p className="text-sm text-zinc-500">Client - {customer.client.clientNumber}</p>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-lg text-zinc-500 text-sm">No client account linked</div>
                )}
                {customer.partner ? (
                  <Link
                    href={`/admin/partners/${customer.partner.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{customer.partner.name}</p>
                      <p className="text-sm text-zinc-500">Partner - {customer.partner.partnerNumber}</p>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-lg text-zinc-500 text-sm">No partner account linked</div>
                )}
                {customer.teamMember ? (
                  <Link
                    href={`/admin/team/${customer.teamMember.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{customer.teamMember.title}</p>
                      <p className="text-sm text-zinc-500">Team Member - {customer.teamMember.employeeNumber}</p>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="p-3 bg-zinc-900 rounded-lg text-zinc-500 text-sm">No team member record</div>
                )}
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View All
                </button>
              </div>
              {!customer.orders || customer.orders.length === 0 ? (
                <p className="text-zinc-500 text-sm">No orders yet</p>
              ) : (
                <div className="space-y-2">
                  {customer.orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <div>
                        <p className="text-blue-400 font-mono text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-zinc-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatCurrency(order.total)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
          {!customer.orders || customer.orders.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No orders found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Total</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {customer.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-900/50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-blue-400">{order.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-white">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Edit Profile */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono"
                  placeholder="username"
                />
                <p className="text-xs text-zinc-500 mt-1">Lowercase letters and numbers only</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title/Position</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="e.g., CEO, Manager"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Account Actions</h2>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 rounded-lg">
                <h3 className="text-white font-medium mb-1">Reset Password</h3>
                <p className="text-sm text-zinc-500 mb-3">
                  Set a new password for this user account.
                </p>
                <button
                  onClick={() => setShowResetPasswordModal(true)}
                  className="px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors text-sm"
                >
                  Reset Password
                </button>
              </div>

              {!customer.teamMember && (
                <div className="p-4 bg-zinc-900 rounded-lg">
                  <h3 className="text-white font-medium mb-1">Promote to Team Member</h3>
                  <p className="text-sm text-zinc-500 mb-3">
                    Create a team member record and optionally grant admin access.
                  </p>
                  <button
                    onClick={() => setShowPromoteModal(true)}
                    className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-colors text-sm"
                  >
                    Promote to Team
                  </button>
                </div>
              )}

              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                <h3 className="text-white font-medium mb-1">Account Information</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">User ID</span>
                    <span className="text-zinc-400 font-mono text-xs">{customer.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Created</span>
                    <span className="text-zinc-400">{formatDate(customer.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Email Verified</span>
                    <span className={customer.emailVerified ? 'text-green-400' : 'text-amber-400'}>
                      {customer.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promote to Team Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">Promote to Team Member</h2>
              <p className="text-sm text-zinc-400 mt-1">
                Create a team member record for {customer.name || customer.email}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Job Title *</label>
                <input
                  type="text"
                  value={promoteData.title}
                  onChange={(e) => setPromoteData({ ...promoteData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Department</label>
                <input
                  type="text"
                  value={promoteData.department}
                  onChange={(e) => setPromoteData({ ...promoteData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="e.g., Engineering"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoteData.grantAdminAccess}
                  onChange={(e) => setPromoteData({ ...promoteData, grantAdminAccess: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-zinc-400">Grant admin access</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPromoteModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromoteToTeam}
                  disabled={!promoteData.title || promoting}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {promoting ? 'Promoting...' : 'Promote'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <ResetPasswordModal
          user={{ id: customer.id, email: customer.email, name: customer.name }}
          onClose={() => setShowResetPasswordModal(false)}
          onSaved={() => setShowResetPasswordModal(false)}
        />
      )}
    </div>
  )
}

// Reset Password Modal Component
function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: { id: string; email: string | null; name: string | null }
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sendNotification, setSendNotification] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: password,
          sendNotification,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')

      alert('Password reset successfully' + (data.notificationSent ? ' - notification email sent' : ''))
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Set a new password for {user.name || user.email}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-zinc-400">Send email notification to user</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

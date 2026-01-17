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
  createdAt: string
  emailVerified: string | null
  orders: Order[]
  _count: {
    orders: number
  }
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
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [promoteData, setPromoteData] = useState({
    title: '',
    department: '',
    grantAdminAccess: true,
  })

  useEffect(() => {
    fetchCustomer()
  }, [params.id])

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
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

      // Redirect to the new team member page
      router.push(`/admin/team/${data.teamMemberId}`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPromoting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PROCESSING: '#3b82f6',
      SHIPPED: '#8b5cf6',
      DELIVERED: '#10b981',
      CANCELLED: '#ef4444',
      REFUNDED: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', color: '#fff' }}>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div style={{ padding: '32px', color: '#fff' }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#ef4444', fontSize: '18px', marginBottom: '16px' }}>
            {error || 'Customer not found'}
          </p>
          <Link
            href="/admin/users"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
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
    <div style={{ padding: '32px', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/users"
          style={{
            color: '#71717a',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '12px',
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 600,
            }}>
              {customer.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || customer.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                {customer.name || 'Unnamed Customer'}
              </h1>
              <p style={{ color: '#a1a1aa', margin: 0 }}>{customer.email}</p>
              {customer.username && (
                <p style={{ color: '#71717a', margin: '4px 0 0 0', fontSize: '13px' }}>
                  @{customer.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowPromoteModal(true)}
            style={{
              padding: '10px 20px',
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Promote to Team
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Total Orders</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
            {customer._count?.orders || 0}
          </p>
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Total Spent</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0', color: '#10b981' }}>
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>Customer Since</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '8px 0 0 0' }}>
            {formatDate(customer.createdAt)}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Contact Information
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>Email</p>
              <p style={{ margin: '4px 0 0 0' }}>{customer.email || '-'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>Phone</p>
              <p style={{ margin: '4px 0 0 0' }}>{customer.phone || '-'}</p>
            </div>
            <div>
              <p style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>Email Verified</p>
              <p style={{ margin: '4px 0 0 0' }}>
                {customer.emailVerified ? (
                  <span style={{ color: '#10b981' }}>Yes - {formatDate(customer.emailVerified)}</span>
                ) : (
                  <span style={{ color: '#f59e0b' }}>Not verified</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
            Order History
          </h2>
        </div>

        {!customer.orders || customer.orders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#71717a' }}>
            No orders yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#27272a' }}>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>Order</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>Date</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>Status</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>Total</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#a1a1aa' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #27272a' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: '#a1a1aa' }}>
                    {formatDate(order.createdAt)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
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
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(order.total)}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '14px',
                      }}
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

      {/* Promote to Team Modal */}
      {showPromoteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #27272a' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Promote to Team Member</h2>
              <p style={{ color: '#71717a', fontSize: '14px', margin: '8px 0 0 0' }}>
                This will create a team member record and optionally grant admin access.
              </p>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Job Title *
                </label>
                <input
                  type="text"
                  value={promoteData.title}
                  onChange={(e) => setPromoteData({ ...promoteData, title: e.target.value })}
                  placeholder="e.g., Software Engineer, Sales Manager"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={promoteData.department}
                  onChange={(e) => setPromoteData({ ...promoteData, department: e.target.value })}
                  placeholder="e.g., Engineering, Sales, Marketing"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={promoteData.grantAdminAccess}
                    onChange={(e) => setPromoteData({ ...promoteData, grantAdminAccess: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ color: '#fff', fontSize: '14px' }}>
                    Grant admin access (change role from Customer to Admin)
                  </span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPromoteModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: '#a1a1aa',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePromoteToTeam}
                  disabled={!promoteData.title || promoting}
                  style={{
                    padding: '10px 20px',
                    background: '#7c3aed',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: promoting || !promoteData.title ? 'not-allowed' : 'pointer',
                    opacity: promoting || !promoteData.title ? 0.5 : 1,
                  }}
                >
                  {promoting ? 'Promoting...' : 'Promote to Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

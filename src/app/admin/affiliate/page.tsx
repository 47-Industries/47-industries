'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Referral {
  id: string
  platform: string
  eventType: string
  orderId: string | null
  motorevUserId: string | null
  customerEmail: string | null
  customerName: string | null
  orderTotal: number | null
  signupAt: string | null
  convertedAt: string | null
  partner: {
    id: string
    name: string
    partnerNumber: string
  }
  link: {
    code: string
    name: string | null
  } | null
  commission: {
    id: string
    type: string
    amount: number
    status: string
  } | null
  createdAt: string
}

interface Commission {
  id: string
  type: string
  baseAmount: number
  rate: number | null
  amount: number
  status: string
  notes: string | null
  partner: {
    id: string
    name: string
    partnerNumber: string
  }
  referral: {
    id: string
    platform: string
    eventType: string
    orderId: string | null
    motorevUserId: string | null
    customerEmail: string | null
    orderTotal: number | null
  }
  payout: {
    id: string
    payoutNumber: string
    status: string
  } | null
  createdAt: string
}

interface Stats {
  totalPending: number
  totalApproved: number
  totalPaid: number
  pendingCount: number
  approvedCount: number
  paidCount: number
}

export default function AdminAffiliatePage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'referrals' | 'commissions'>('commissions')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [approving, setApproving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [activeTab, platformFilter, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'referrals') {
        const params = new URLSearchParams()
        if (platformFilter !== 'all') params.append('platform', platformFilter)
        if (statusFilter !== 'all') params.append('status', statusFilter)

        const res = await fetch(`/api/admin/affiliate?${params}`)
        if (res.ok) {
          const data = await res.json()
          setReferrals(data.referrals)
          setStats(data.stats)
        }
      } else {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.append('status', statusFilter)

        const res = await fetch(`/api/admin/affiliate/commissions?${params}`)
        if (res.ok) {
          const data = await res.json()
          setCommissions(data.commissions)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveCommissions = async () => {
    if (selectedCommissions.length === 0) {
      showToast('Please select commissions to approve', 'error')
      return
    }

    setApproving(true)
    try {
      const res = await fetch('/api/admin/affiliate/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionIds: selectedCommissions,
          action: 'approve',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        showToast(`${data.updated} commission(s) approved`, 'success')
        setSelectedCommissions([])
        fetchData()
      } else {
        showToast('Failed to approve commissions', 'error')
      }
    } catch (error) {
      showToast('Failed to approve commissions', 'error')
    } finally {
      setApproving(false)
    }
  }

  const toggleCommissionSelection = (id: string) => {
    setSelectedCommissions(prev =>
      prev.includes(id)
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    )
  }

  const selectAllPending = () => {
    const pendingIds = commissions
      .filter(c => c.status === 'PENDING')
      .map(c => c.id)
    setSelectedCommissions(pendingIds)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const getPlatformLabel = (platform: string) => {
    return platform === 'MOTOREV' ? 'MotoRev' : 'Shop'
  }

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      ORDER: 'Order',
      SIGNUP: 'Signup',
      PRO_CONVERSION: 'Pro Conversion',
    }
    return labels[event] || event
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SHOP_ORDER: 'Shop Order',
      APP_PRO_CONVERSION: 'MotoRev Pro',
    }
    return labels[type] || type
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
          Affiliate Management
        </h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(stats.totalPending)}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.pendingCount} commissions</p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Approved</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              {formatCurrency(stats.totalApproved)}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.approvedCount} commissions</p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Paid</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(stats.totalPaid)}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.paidCount} commissions</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #27272a',
        paddingBottom: '12px',
      }}>
        <button
          onClick={() => setActiveTab('commissions')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'commissions' ? '#3b82f6' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'commissions' ? 600 : 400,
          }}
        >
          Commissions
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'referrals' ? '#3b82f6' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'referrals' ? 600 : 400,
          }}
        >
          Referrals
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {activeTab === 'referrals' && (
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#1a1a1a',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            <option value="all">All Platforms</option>
            <option value="SHOP">Shop</option>
            <option value="MOTOREV">MotoRev</option>
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            background: '#1a1a1a',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="PAID">Paid</option>
        </select>

        {activeTab === 'commissions' && selectedCommissions.length > 0 && (
          <button
            onClick={handleApproveCommissions}
            disabled={approving}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: approving ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              opacity: approving ? 0.5 : 1,
            }}
          >
            {approving ? 'Approving...' : `Approve ${selectedCommissions.length} Selected`}
          </button>
        )}

        {activeTab === 'commissions' && commissions.some(c => c.status === 'PENDING') && (
          <button
            onClick={selectAllPending}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Select All Pending
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          Loading...
        </div>
      ) : activeTab === 'commissions' ? (
        /* Commissions Table */
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #27272a',
          overflow: 'hidden',
        }}>
          {commissions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
              No commissions found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>
                      <input
                        type="checkbox"
                        checked={selectedCommissions.length === commissions.filter(c => c.status === 'PENDING').length && commissions.some(c => c.status === 'PENDING')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllPending()
                          } else {
                            setSelectedCommissions([])
                          }
                        }}
                      />
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Partner</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Base</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <tr
                      key={commission.id}
                      style={{
                        borderBottom: '1px solid #27272a',
                        background: selectedCommissions.includes(commission.id) ? '#27272a' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        {commission.status === 'PENDING' && (
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(commission.id)}
                            onChange={() => toggleCommissionSelection(commission.id)}
                          />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(commission.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link
                          href={`/admin/partners/${commission.partner.id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
                        >
                          {commission.partner.name}
                        </Link>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          {commission.partner.partnerNumber}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {getTypeLabel(commission.type)}
                        {commission.rate && (
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            {commission.rate}% rate
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {commission.referral.customerEmail || 'Anonymous'}
                        {commission.referral.orderId && (
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            Order ID: {commission.referral.orderId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                        {commission.baseAmount > 0 ? formatCurrency(commission.baseAmount) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(commission.amount)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: `${getStatusColor(commission.status)}20`,
                          color: getStatusColor(commission.status),
                        }}>
                          {commission.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Referrals Table */
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #27272a',
          overflow: 'hidden',
        }}>
          {referrals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
              No referrals found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Partner</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Platform</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Event</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Value</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} style={{ borderBottom: '1px solid #27272a' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(referral.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link
                          href={`/admin/partners/${referral.partner.id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
                        >
                          {referral.partner.name}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: referral.platform === 'MOTOREV' ? '#7c3aed20' : '#10b98120',
                          color: referral.platform === 'MOTOREV' ? '#a78bfa' : '#34d399',
                        }}>
                          {getPlatformLabel(referral.platform)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {getEventLabel(referral.eventType)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {referral.customerEmail || 'Anonymous'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                        {referral.orderTotal ? formatCurrency(referral.orderTotal) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                        {referral.commission ? formatCurrency(referral.commission.amount) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {referral.commission ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: `${getStatusColor(referral.commission.status)}20`,
                            color: getStatusColor(referral.commission.status),
                          }}>
                            {referral.commission.status}
                          </span>
                        ) : (
                          <span style={{ color: '#71717a', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

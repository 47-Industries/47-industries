'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface UserAffiliate {
  id: string
  affiliateCode: string
  motorevUserId: string | null
  motorevEmail: string | null
  connectedAt: string | null
  shopCommissionRate: number
  motorevProBonus: number
  retentionBonus: number
  isPartner: boolean
  totalReferrals: number
  totalEarnings: number
  pendingEarnings: number
  proTimeEarnedDays: number
  rewardPreference: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  partner: {
    id: string
    name: string
  } | null
  createdAt: string
}

interface Commission {
  id: string
  type: string
  baseAmount: number
  rate: number | null
  amount: number
  rewardType: string
  proTimeDays: number | null
  status: string
  userAffiliate: {
    id: string
    affiliateCode: string
    user: {
      name: string | null
      email: string | null
    }
  }
  referral: {
    platform: string
    eventType: string
    motorevEmail: string | null
    orderTotal: number | null
    retentionMonth: number | null
  }
  createdAt: string
}

interface Stats {
  totalAffiliates: number
  connectedAffiliates: number
  pendingCashTotal: number
  pendingCashCount: number
  pendingProTimeDays: number
  pendingProTimeCount: number
}

export default function AdminUserAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<UserAffiliate[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'affiliates' | 'commissions'>('affiliates')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rewardFilter, setRewardFilter] = useState('all')
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([])
  const [approving, setApproving] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [activeTab, statusFilter, rewardFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'affiliates') {
        const res = await fetch('/api/admin/user-affiliates')
        if (res.ok) {
          const data = await res.json()
          setAffiliates(data.affiliates)
          setStats(data.stats)
        }
      } else {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (rewardFilter !== 'all') params.append('rewardType', rewardFilter)

        const res = await fetch(`/api/admin/user-affiliates/commissions?${params}`)
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
      const res = await fetch('/api/admin/user-affiliates/commissions', {
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

  const formatProTime = (days: number) => {
    if (days < 30) {
      return `${days}d`
    }
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
      APPLIED: '#a855f7',
    }
    return colors[status] || '#6b7280'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRO_CONVERSION: 'Pro Conversion',
      RETENTION_BONUS: 'Retention Bonus',
      SHOP_ORDER: 'Shop Order',
    }
    return labels[type] || type
  }

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      SIGNUP: 'Signup',
      PRO_CONVERSION: 'Pro Conversion',
      RETENTION: 'Retention',
      ORDER: 'Order',
    }
    return labels[event] || event
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
          User Affiliates
        </h1>
        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
          Manage MotoRev-connected user affiliates
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Total Affiliates</p>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>
              {stats.totalAffiliates}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.connectedAffiliates} connected</p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Pending Cash</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(stats.pendingCashTotal)}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.pendingCashCount} commissions</p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Pending Pro Time</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7' }}>
              {formatProTime(stats.pendingProTimeDays)}
            </p>
            <p style={{ color: '#71717a', fontSize: '12px' }}>{stats.pendingProTimeCount} credits</p>
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
          onClick={() => setActiveTab('affiliates')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'affiliates' ? '#3b82f6' : 'transparent',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: activeTab === 'affiliates' ? 600 : 400,
          }}
        >
          Affiliates
        </button>
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
      </div>

      {/* Filters */}
      {activeTab === 'commissions' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
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
            <option value="APPLIED">Applied</option>
          </select>
          <select
            value={rewardFilter}
            onChange={(e) => setRewardFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#1a1a1a',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            <option value="all">All Reward Types</option>
            <option value="CASH">Cash</option>
            <option value="PRO_TIME">Pro Time</option>
          </select>

          {selectedCommissions.length > 0 && (
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

          {commissions.some(c => c.status === 'PENDING') && (
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
      )}

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          Loading...
        </div>
      ) : activeTab === 'affiliates' ? (
        /* Affiliates Table */
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #27272a',
          overflow: 'hidden',
        }}>
          {affiliates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
              No user affiliates found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>User</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Code</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>MotoRev</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Referrals</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Earnings</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Pro Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Preference</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} style={{ borderBottom: '1px solid #27272a' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>
                          {affiliate.user.name || 'Unnamed'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          {affiliate.user.email}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{
                          padding: '4px 8px',
                          background: '#27272a',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                        }}>
                          {affiliate.affiliateCode}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {affiliate.connectedAt ? (
                          <div>
                            <span style={{ color: '#10b981' }}>Connected</span>
                            <div style={{ fontSize: '12px', color: '#71717a' }}>
                              {affiliate.motorevEmail || affiliate.motorevUserId}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#71717a' }}>Not connected</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                        {affiliate.totalReferrals}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#10b981' }}>
                          {formatCurrency(affiliate.totalEarnings)}
                        </div>
                        {affiliate.pendingEarnings > 0 && (
                          <div style={{ fontSize: '12px', color: '#f59e0b' }}>
                            {formatCurrency(affiliate.pendingEarnings)} pending
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                        {affiliate.proTimeEarnedDays > 0 ? (
                          <span style={{ color: '#a855f7' }}>
                            {formatProTime(affiliate.proTimeEarnedDays)}
                          </span>
                        ) : (
                          <span style={{ color: '#71717a' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: affiliate.rewardPreference === 'PRO_TIME' ? '#a855f720' : '#10b98120',
                          color: affiliate.rewardPreference === 'PRO_TIME' ? '#a855f7' : '#10b981',
                        }}>
                          {affiliate.rewardPreference === 'PRO_TIME' ? 'Pro Time' : 'Cash'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {affiliate.isPartner ? (
                          <Link
                            href={`/admin/partners/${affiliate.partner?.id}`}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 500,
                              background: '#3b82f620',
                              color: '#3b82f6',
                              textDecoration: 'none',
                            }}
                          >
                            Partner
                          </Link>
                        ) : (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: '#27272a',
                            color: '#a1a1aa',
                          }}>
                            User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
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
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Affiliate</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Referred User</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Reward</th>
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
                        <div style={{ fontSize: '14px' }}>
                          {commission.userAffiliate.user.name || 'Unnamed'}
                        </div>
                        <code style={{
                          fontSize: '11px',
                          color: '#71717a',
                          fontFamily: 'monospace',
                        }}>
                          {commission.userAffiliate.affiliateCode}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {getTypeLabel(commission.type)}
                        {commission.referral.retentionMonth && (
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            Month {commission.referral.retentionMonth}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {commission.referral.motorevEmail || 'Anonymous'}
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          {getEventLabel(commission.referral.eventType)}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {commission.rewardType === 'CASH' ? (
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                            {formatCurrency(commission.amount)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#a855f7' }}>
                            {commission.proTimeDays}d Pro
                          </span>
                        )}
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
      )}
    </div>
  )
}
